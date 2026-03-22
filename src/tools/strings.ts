// Strings 工具 - 词条搜索、查看、翻译、批量操作

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ParaTranzClient } from "../client.js";

const StageSchema = z
    .number()
    .int()
    .refine((v) => [0, 1, 2, 3, 5, 9, -1].includes(v), {
        message: "词条状态必须是 0(未翻译), 1(已翻译), 2(有疑问), 3(已检查), 5(已审核), 9(已锁定), -1(已隐藏)",
    });

export function registerStringTools(server: McpServer, client: ParaTranzClient) {
    server.registerTool(
        "list_strings",
        {
            description:
                "获取 ParaTranz 项目的词条列表。可按文件、翻译状态筛选，支持分页。" +
                "状态值: 0=未翻译, 1=已翻译, 2=有疑问, 3=已检查, 5=已审核, 9=已锁定, -1=已隐藏",
            inputSchema: {
                projectId: z.number().int().min(1).describe("项目 ID"),
                page: z.number().int().min(1).default(1).describe("页码，默认 1"),
                pageSize: z.number().int().min(1).max(800).default(50).describe("每页数量，默认 50"),
                file: z.number().int().min(1).optional().describe("按文件 ID 筛选"),
                stage: StageSchema.optional().describe("按词条状态筛选"),
            },
        },
        async ({ projectId, page, pageSize, file, stage }) => {
            const result = await client.getStrings(projectId, {
                page,
                pageSize,
                file,
                stage: stage as any,
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
        "get_string",
        {
            description: "通过 ID 获取单个词条的详细信息，包含原文、译文、状态、历史记录等",
            inputSchema: {
                projectId: z.number().int().min(1).describe("项目 ID"),
                stringId: z.number().int().min(1).describe("词条 ID"),
            },
        },
        async ({ projectId, stringId }) => {
            const str = await client.getString(projectId, stringId);
            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(str, null, 2),
                    },
                ],
            };
        }
    );

    server.registerTool(
        "update_string",
        {
            description:
                "更新词条的翻译、状态或上下文。" +
                "状态值: 0=未翻译, 1=已翻译, 2=有疑问, 3=已检查, 5=已审核, 9=已锁定, -1=已隐藏",
            inputSchema: {
                projectId: z.number().int().min(1).describe("项目 ID"),
                stringId: z.number().int().min(1).describe("词条 ID"),
                translation: z.string().optional().describe("词条译文"),
                stage: StageSchema.optional().describe("词条状态"),
                context: z.string().optional().describe("词条上下文备注"),
            },
        },
        async ({ projectId, stringId, translation, stage, context }) => {
            const data: Record<string, unknown> = {};
            if (translation !== undefined) data.translation = translation;
            if (stage !== undefined) data.stage = stage;
            if (context !== undefined) data.context = context;

            const result = await client.saveString(projectId, stringId, data as any);
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
        "batch_update_strings",
        {
            description:
                "批量修改或删除词条。可以同时修改多个词条的翻译或状态。" +
                "操作类型: update=更新, delete=删除。",
            inputSchema: {
                projectId: z.number().int().min(1).describe("项目 ID"),
                op: z.enum(["update", "delete"]).describe("操作类型: update 或 delete"),
                ids: z.array(z.number().int().min(1)).min(1).describe("需要操作的词条 ID 列表"),
                translation: z.string().optional().describe("批量设置的译文（仅 update 时有效）"),
                stage: StageSchema.optional().describe("批量设置的状态（仅 update 时有效）"),
            },
        },
        async ({ projectId, op, ids, translation, stage }) => {
            const data: Record<string, unknown> = {};
            if (translation !== undefined) data.translation = translation;
            if (stage !== undefined) data.stage = stage;

            const result = await client.batchStrings(projectId, op, ids, data as any);
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
