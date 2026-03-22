// Issues 工具 - 讨论查看、创建、回复

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ParaTranzClient } from "../client.js";

export function registerIssueTools(server: McpServer, client: ParaTranzClient) {
    server.registerTool(
        "list_issues",
        {
            description:
                "获取项目讨论列表。可按状态筛选: 0=讨论中, 1=已关闭",
            inputSchema: {
                projectId: z.number().int().min(1).describe("项目 ID"),
                status: z
                    .number()
                    .int()
                    .refine((v) => v === 0 || v === 1)
                    .optional()
                    .describe("按状态筛选: 0=讨论中, 1=已关闭"),
            },
        },
        async ({ projectId, status }) => {
            const result = await client.getIssues(projectId, status as 0 | 1 | undefined);
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

    server.registerTool(
        "get_issue",
        {
            description: "通过 ID 获取讨论详情，包含所有回复和订阅者",
            inputSchema: {
                projectId: z.number().int().min(1).describe("项目 ID"),
                issueId: z.number().int().min(1).describe("讨论 ID"),
            },
        },
        async ({ projectId, issueId }) => {
            const issue = await client.getIssue(projectId, issueId);
            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(issue, null, 2),
                    },
                ],
            };
        }
    );

    server.registerTool(
        "create_issue",
        {
            description: "在项目中创建一条新讨论",
            inputSchema: {
                projectId: z.number().int().min(1).describe("项目 ID"),
                title: z.string().min(1).describe("讨论标题"),
                content: z.string().min(1).describe("讨论内容，支持 Markdown"),
            },
        },
        async ({ projectId, title, content }) => {
            const issue = await client.createIssue(projectId, { title, content });
            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(issue, null, 2),
                    },
                ],
            };
        }
    );

    server.registerTool(
        "reply_to_issue",
        {
            description: "回复某个讨论",
            inputSchema: {
                projectId: z.number().int().min(1).describe("项目 ID"),
                issueId: z.number().int().min(1).describe("讨论 ID"),
                content: z.string().min(1).describe("回复内容，支持 Markdown"),
            },
        },
        async ({ projectId, issueId, content }) => {
            const reply = await client.replyIssue(projectId, issueId, content);
            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(reply, null, 2),
                    },
                ],
            };
        }
    );
}
