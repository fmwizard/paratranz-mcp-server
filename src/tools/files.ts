// Files 工具 - 文件列表与详情

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ParaTranzClient } from "../client.js";

export function registerFileTools(server: McpServer, client: ParaTranzClient) {
    server.registerTool(
        "list_files",
        {
            description: "获取 ParaTranz 项目的文件列表，包含每个文件的翻译进度统计",
            inputSchema: {
                projectId: z.number().int().min(1).describe("项目 ID"),
            },
        },
        async ({ projectId }) => {
            const files = await client.getFiles(projectId);
            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(files, null, 2),
                    },
                ],
            };
        }
    );

    server.registerTool(
        "get_file",
        {
            description: "通过 ID 获取文件详细信息，包含翻译进度",
            inputSchema: {
                projectId: z.number().int().min(1).describe("项目 ID"),
                fileId: z.number().int().min(1).describe("文件 ID"),
            },
        },
        async ({ projectId, fileId }) => {
            const file = await client.getFile(projectId, fileId);
            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(file, null, 2),
                    },
                ],
            };
        }
    );
}
