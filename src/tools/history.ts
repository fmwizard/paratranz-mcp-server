// History 工具 - 历史记录查看

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ParaTranzClient } from "../client.js";

export function registerHistoryTools(server: McpServer, client: ParaTranzClient) {
    server.registerTool(
        "get_history",
        {
            description:
                "获取项目历史记录。可按用户、词条、类型筛选。" +
                "类型: text=词条历史(默认), term=术语修改, import=导入历史, comment=评论记录。" +
                "支持 MCP 层后过滤: field 和 operation（API 返回后过滤，单页实际条数可能少于 pageSize）",
            inputSchema: {
                projectId: z.number().int().min(1).describe("项目 ID"),
                page: z.number().int().min(1).default(1).describe("页码，默认 1"),
                pageSize: z.number().int().min(1).max(800).default(50).describe("每页数量，默认 50"),
                uid: z.number().int().optional().describe("按用户 ID 筛选"),
                tid: z.number().int().optional().describe("按词条 ID 筛选（type=text 时有效，指定后分页失效）"),
                type: z
                    .enum(["text", "term", "import", "comment"])
                    .optional()
                    .describe("历史记录类型"),
                field: z
                    .string()
                    .optional()
                    .describe("按变更字段后过滤，如 'translation' 仅返回翻译变更，'stage' 仅返回状态变更"),
                operation: z
                    .enum(["translate", "edit", "reset", "dispute", "review", "rollback", "lock", "hide"])
                    .optional()
                    .describe("按操作类型后过滤"),
            },
        },
        async ({ projectId, page, pageSize, uid, tid, type, field, operation }) => {
            const result = await client.getHistory(projectId, {
                page,
                pageSize,
                uid,
                tid,
                type,
            });

            // MCP 层后过滤
            if (field || operation) {
                result.results = result.results.filter((item) => {
                    if (field && item.field !== field) return false;
                    if (operation && item.operation !== operation) return false;
                    return true;
                });
            }

            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }
    );
}
