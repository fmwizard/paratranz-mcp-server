// Summary 工具 - 每日翻译汇总

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ParaTranzClient } from "../client.js";
import type {
    History,
    TranslationSummary,
    UserTranslationSummary,
    TranslationEntry,
    RevisionDetail,
} from "../types.js";
import { formatSummaryMarkdown } from "./summary-format.js";

/** 最大遍历页数，防止无限循环 */
const MAX_PAGES = 20;

/** 每页最大条数 */
const PAGE_SIZE = 800;

/**
 * 将 "+08:00" / "-05:30" / "+00:00" 等偏移字符串解析为分钟数。
 * 返回值为 UTC 偏移：+480 表示 UTC+8。
 */
function parseTimezoneOffset(tz: string): number {
    const match = tz.match(/^([+-])(\d{2}):(\d{2})$/);
    if (!match) return 0; // 解析失败则回退到 UTC
    const sign = match[1] === "+" ? 1 : -1;
    return sign * (parseInt(match[2], 10) * 60 + parseInt(match[3], 10));
}

export function registerSummaryTools(server: McpServer, client: ParaTranzClient) {
    server.registerTool(
        "get_translation_summary",
        {
            description:
                "获取项目某一天的翻译汇总。自动遍历历史记录，按用户分组、按 key 聚合，" +
                "保留每个词条的完整编辑链路（revisions），包含翻译变更和状态变更。" +
                "返回每个用户的新翻译数、编辑数、审核数和全部词条明细。" +
                "最多遍历 20 页（16000 条）历史记录。" +
                "支持 format 参数切换 JSON/Markdown 输出，detail 参数控制是否包含词条明细。" +
                "注意：date 参数会按 timezone 指定的时区解释，默认为北京时间 (UTC+8)。",
            inputSchema: {
                projectId: z.number().int().min(1).describe("项目 ID"),
                date: z
                    .string()
                    .regex(/^\d{4}-\d{2}-\d{2}$/)
                    .describe("目标日期 (YYYY-MM-DD 格式)，按 timezone 参数指定的时区解释"),
                uid: z.number().int().optional().describe("可选，只看某个用户"),
                timezone: z
                    .string()
                    .regex(/^[+-]\d{2}:\d{2}$/)
                    .default("+08:00")
                    .describe(
                        "时区偏移量，格式如 '+08:00'（北京时间）、'+00:00'（UTC）。默认 '+08:00'"
                    ),
                format: z
                    .enum(["json", "markdown"])
                    .default("json")
                    .describe(
                        "输出格式：json（默认，结构化数据）或 markdown（LLM 友好的可读格式）"
                    ),
                detail: z
                    .enum(["overview", "full"])
                    .default("full")
                    .describe(
                        "详细程度：full（默认，含全部词条明细）或 overview（仅用户统计，不含 translations 数组）"
                    ),
            },
        },
        async ({ projectId, date, uid, timezone, format, detail }) => {
            // 计算目标日期在用户时区下对应的 UTC 范围
            const offsetMinutes = parseTimezoneOffset(timezone);
            // 用户时区的 00:00:00 → UTC 时间 = 00:00:00 - offset
            const dateStart = new Date(`${date}T00:00:00Z`);
            dateStart.setUTCMinutes(dateStart.getUTCMinutes() - offsetMinutes);
            const dateEnd = new Date(`${date}T23:59:59.999Z`);
            dateEnd.setUTCMinutes(dateEnd.getUTCMinutes() - offsetMinutes);

            // 收集目标日期内的历史记录（translation + stage 字段）
            const relevantRecords: History[] = [];
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

                    // 只保留目标日期内、field 为 translation 或 stage 的记录
                    if (
                        recordTime <= dateEnd &&
                        (record.field === "translation" || record.field === "stage")
                    ) {
                        relevantRecords.push(record);
                    }
                }

                // 如果当前页不满，说明已到最后一页
                if (result.results.length < PAGE_SIZE) break;
                page++;
            }

            // 按用户分组，每个用户内按 key 聚合全部记录
            const userMap = new Map<
                number,
                {
                    username: string;
                    keyMap: Map<string, History[]>;
                }
            >();

            for (const record of relevantRecords) {
                const userId = record.uid ?? 0;
                const username = record.user?.nickname ?? record.user?.username ?? `User#${userId}`;
                const key = record.target?.key ?? `tid:${record.tid}`;

                if (!userMap.has(userId)) {
                    userMap.set(userId, { username, keyMap: new Map() });
                }

                const userData = userMap.get(userId)!;

                if (!userData.keyMap.has(key)) {
                    userData.keyMap.set(key, []);
                }
                // 记录按降序到达，推入数组后最后再反转
                userData.keyMap.get(key)!.push(record);
            }

            // 构建输出
            const users: UserTranslationSummary[] = [];
            let totalUniqueKeys = 0;

            for (const [userId, userData] of userMap) {
                const translations: TranslationEntry[] = [];
                let newTranslations = 0;
                let edits = 0;
                let reviews = 0;

                for (const [key, records] of userData.keyMap) {
                    // 反转为时间正序
                    records.reverse();

                    // 构建 revisions 链路
                    const revisions: RevisionDetail[] = records.map((r) => ({
                        time: r.createdAt,
                        field: r.field ?? "",
                        from: r.from ?? "",
                        to: r.to ?? "",
                        operation: r.operation ?? "",
                    }));

                    // 判断该词条的综合操作类型
                    const operations = new Set(records.map((r) => r.operation));
                    const hasTranslate = operations.has("translate");
                    const hasEdit = operations.has("edit");
                    const hasReview = operations.has("review");

                    let operation: string;
                    if (hasTranslate && hasEdit) {
                        operation = "translate+edit";
                    } else if (hasTranslate) {
                        operation = "translate";
                    } else if (hasEdit) {
                        operation = "edit";
                    } else if (hasReview) {
                        operation = "review";
                    } else {
                        // 从记录中取最后一个有意义的 operation
                        operation = records[records.length - 1].operation ?? "unknown";
                    }

                    if (hasTranslate) newTranslations++;
                    if (hasEdit) edits++;
                    if (hasReview) reviews++;

                    // 取最后一条 translation 字段的记录作为最终译文
                    const lastTranslationRecord = [...records]
                        .reverse()
                        .find((r) => r.field === "translation");
                    const finalTranslation =
                        lastTranslationRecord?.to ??
                        records[records.length - 1].target?.translation ??
                        "";

                    translations.push({
                        key,
                        original: records[0].target?.original ?? "",
                        translation: finalTranslation,
                        operation,
                        revisions,
                    });
                }

                totalUniqueKeys += userData.keyMap.size;

                users.push({
                    uid: userId,
                    username: userData.username,
                    newTranslations,
                    edits,
                    reviews,
                    uniqueKeys: userData.keyMap.size,
                    translations,
                });
            }

            // 按贡献数降序排列
            users.sort((a, b) => b.uniqueKeys - a.uniqueKeys);

            const summary: TranslationSummary = {
                date,
                timezone,
                projectId,
                totalEntries: relevantRecords.length,
                totalUniqueKeys,
                users,
            };

            // detail=overview 时剥离 translations 数组
            if (detail === "overview") {
                summary.users = summary.users.map((u) => ({
                    ...u,
                    translations: [],
                }));
            }

            const text =
                format === "markdown"
                    ? formatSummaryMarkdown(summary, detail)
                    : JSON.stringify(summary, null, 2);

            return {
                content: [
                    {
                        type: "text" as const,
                        text,
                    },
                ],
            };
        }
    );
}
