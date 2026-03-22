// Terms 工具 - 术语查看、创建、修改、删除

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ParaTranzClient } from "../client.js";

export function registerTermTools(server: McpServer, client: ParaTranzClient) {
    server.registerTool(
        "list_terms",
        {
            description: "获取项目术语表，包含术语原文、译文、词性、注释等信息",
            inputSchema: {
                projectId: z.number().int().min(1).describe("项目 ID"),
                page: z.number().int().min(1).default(1).describe("页码，默认 1"),
                pageSize: z.number().int().min(1).max(800).default(50).describe("每页数量，默认 50"),
            },
        },
        async ({ projectId, page, pageSize }) => {
            const result = await client.getTerms(projectId, page, pageSize);
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
        "get_term",
        {
            description: "通过 ID 获取术语详细信息",
            inputSchema: {
                projectId: z.number().int().min(1).describe("项目 ID"),
                termId: z.number().int().min(1).describe("术语 ID"),
            },
        },
        async ({ projectId, termId }) => {
            const term = await client.getTerm(projectId, termId);
            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(term, null, 2),
                    },
                ],
            };
        }
    );

    server.registerTool(
        "create_term",
        {
            description: "在项目中创建新术语。如果已存在相同术语会失败。",
            inputSchema: {
                projectId: z.number().int().min(1).describe("项目 ID"),
                term: z.string().min(1).describe("术语原文"),
                translation: z.string().min(1).describe("术语译文"),
                pos: z.enum(["noun", "verb", "adj", "adv"]).optional().describe("词性"),
                note: z.string().optional().describe("术语注释"),
                variants: z.array(z.string()).optional().describe("术语原文的其他形式（复数、时态等）"),
                caseSensitive: z.boolean().optional().describe("匹配时是否大小写敏感"),
            },
        },
        async ({ projectId, term, translation, pos, note, variants, caseSensitive }) => {
            const result = await client.createTerm(projectId, {
                term,
                translation,
                pos,
                note,
                variants,
                caseSensitive,
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

    server.registerTool(
        "update_term",
        {
            description: "修改已有术语的译文、词性、注释等字段",
            inputSchema: {
                projectId: z.number().int().min(1).describe("项目 ID"),
                termId: z.number().int().min(1).describe("术语 ID"),
                term: z.string().optional().describe("术语原文"),
                translation: z.string().optional().describe("术语译文"),
                pos: z.enum(["noun", "verb", "adj", "adv"]).optional().describe("词性"),
                note: z.string().optional().describe("术语注释"),
                variants: z.array(z.string()).optional().describe("术语原文的其他形式"),
                caseSensitive: z.boolean().optional().describe("匹配时是否大小写敏感"),
            },
        },
        async ({ projectId, termId, ...data }) => {
            const result = await client.saveTerm(projectId, termId, data);
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
        "delete_term",
        {
            description: "删除术语。仅创建者及管理员可以删除。",
            inputSchema: {
                projectId: z.number().int().min(1).describe("项目 ID"),
                termId: z.number().int().min(1).describe("术语 ID"),
            },
        },
        async ({ projectId, termId }) => {
            await client.deleteTerm(projectId, termId);
            return {
                content: [
                    {
                        type: "text" as const,
                        text: `术语 ${termId} 已删除`,
                    },
                ],
            };
        }
    );
}
