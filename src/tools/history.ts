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
                "类型: text=词条历史(默认), term=术语修改, import=导入历史, comment=评论记录",
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
            },
        },
        async ({ projectId, page, pageSize, uid, tid, type }) => {
            const result = await client.getHistory(projectId, {
                page,
                pageSize,
                uid,
                tid,
                type,
            });
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
