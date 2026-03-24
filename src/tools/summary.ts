// Summary 工具 - 每日翻译汇总

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ParaTranzClient } from "../client.js";
import type {
    History,
    TranslationSummary,
    UserTranslationSummary,
    TranslationEntry,
} from "../types.js";

/** 最大遍历页数，防止无限循环 */
const MAX_PAGES = 20;

/** 每页最大条数 */
const PAGE_SIZE = 800;

export function registerSummaryTools(server: McpServer, client: ParaTranzClient) {
    server.registerTool(
        "get_translation_summary",
        {
            description:
                "获取项目某一天的翻译汇总。自动遍历历史记录，按用户分组、按 key 去重，" +
                "返回每个用户的新翻译数、编辑数和全部词条明细。最多遍历 20 页（16000 条）历史记录。",
            inputSchema: {
                projectId: z.number().int().min(1).describe("项目 ID"),
                date: z
                    .string()
                    .regex(/^\d{4}-\d{2}-\d{2}$/)
                    .describe("目标日期 (YYYY-MM-DD 格式)"),
                uid: z.number().int().optional().describe("可选，只看某个用户"),
            },
        },
        async ({ projectId, date, uid }) => {
            const dateStart = new Date(`${date}T00:00:00Z`);
            const dateEnd = new Date(`${date}T23:59:59.999Z`);

            // 收集目标日期内的翻译历史记录
            const translationRecords: History[] = [];
            let page = 1;
            let shouldContinue = true;

            while (shouldContinue && page <= MAX_PAGES) {
                const result = await client.getHistory(projectId, {
                    page,
                    pageSize: PAGE_SIZE,
                    uid,
                });

                if (result.results.length === 0) break;

                for (const record of result.results) {
                    const recordTime = new Date(record.createdAt);

                    // 历史记录按 createdAt 降序，遇到早于目标日期的记录即可提前终止
                    if (recordTime < dateStart) {
                        shouldContinue = false;
                        break;
                    }

                    // 只保留目标日期内、field 为 translation 的记录
                    if (recordTime <= dateEnd && record.field === "translation") {
                        translationRecords.push(record);
                    }
                }

                // 如果当前页不满，说明已到最后一页
                if (result.results.length < PAGE_SIZE) break;
                page++;
            }

            // 按用户分组
            const userMap = new Map<
                number,
                {
                    username: string;
                    keyMap: Map<string, { record: History; operation: string }>;
                }
            >();

            for (const record of translationRecords) {
                const userId = record.uid ?? 0;
                const username = record.user?.nickname ?? record.user?.username ?? `User#${userId}`;
                const key = record.target?.key ?? `tid:${record.tid}`;

                if (!userMap.has(userId)) {
                    userMap.set(userId, { username, keyMap: new Map() });
                }

                const userData = userMap.get(userId)!;

                // 每个 key 只保留最新的记录（第一次遇到的，因为是降序）
                if (!userData.keyMap.has(key)) {
                    const operation = record.from ? "edit" : "translate";
                    userData.keyMap.set(key, { record, operation });
                }
            }

            // 构建输出
            const users: UserTranslationSummary[] = [];
            let totalUniqueKeys = 0;

            for (const [userId, userData] of userMap) {
                const translations: TranslationEntry[] = [];
                let newTranslations = 0;
                let edits = 0;

                for (const [key, { record, operation }] of userData.keyMap) {
                    if (operation === "translate") {
                        newTranslations++;
                    } else {
                        edits++;
                    }

                    translations.push({
                        key,
                        original: record.target?.original ?? "",
                        translation: record.to ?? record.target?.translation ?? "",
                        operation,
                        previousTranslation: record.from || undefined,
                    });
                }

                totalUniqueKeys += userData.keyMap.size;

                users.push({
                    uid: userId,
                    username: userData.username,
                    newTranslations,
                    edits,
                    uniqueKeys: userData.keyMap.size,
                    translations,
                });
            }

            // 按贡献数降序排列
            users.sort((a, b) => b.uniqueKeys - a.uniqueKeys);

            const summary: TranslationSummary = {
                date,
                projectId,
                totalEntries: translationRecords.length,
                totalUniqueKeys,
                users,
            };

            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(summary, null, 2),
                    },
                ],
            };
        }
    );
}
