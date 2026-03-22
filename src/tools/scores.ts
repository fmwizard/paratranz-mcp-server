// Scores 工具 - 成员贡献查看

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ParaTranzClient } from "../client.js";

export function registerScoreTools(server: McpServer, client: ParaTranzClient) {
    server.registerTool(
        "get_scores",
        {
            description:
                "获取项目成员的贡献列表。贡献值(PP)计算公式: 1×翻译词数 + 0.5×编辑词数 + 0.2×审核词数。" +
                "可按用户、操作类型、时间范围筛选。",
            inputSchema: {
                projectId: z.number().int().min(1).describe("项目 ID"),
                page: z.number().int().min(1).default(1).describe("页码，默认 1"),
                pageSize: z.number().int().min(1).max(800).default(50).describe("每页数量，默认 50"),
                uid: z.number().int().optional().describe("按用户 ID 筛选"),
                operation: z
                    .enum(["translate", "edit", "review"])
                    .optional()
                    .describe("按操作类型筛选"),
                start: z.string().optional().describe("筛选开始时间 (ISO 8601 格式)"),
                end: z.string().optional().describe("筛选结束时间 (ISO 8601 格式)"),
            },
        },
        async ({ projectId, page, pageSize, uid, operation, start, end }) => {
            const result = await client.getScores(projectId, {
                page,
                pageSize,
                uid,
                operation,
                start,
                end,
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
