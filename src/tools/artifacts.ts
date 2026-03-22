/**
 * @file Artifacts 工具 - 导出状态与触发
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ParaTranzClient } from "../client.js";

export function registerArtifactTools(server: McpServer, client: ParaTranzClient) {
    server.registerTool(
        "get_export_status",
        {
            description: "获取项目最近一次导出的状态，包含导出时的翻译统计和用时",
            inputSchema: {
                projectId: z.number().int().min(1).describe("项目 ID"),
            },
        },
        async ({ projectId }) => {
            const artifact = await client.getArtifact(projectId);
            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(artifact, null, 2),
                    },
                ],
            };
        }
    );

    server.registerTool(
        "trigger_export",
        {
            description: "手动触发项目导出操作，生成翻译压缩包。仅管理员可使用。",
            inputSchema: {
                projectId: z.number().int().min(1).describe("项目 ID"),
            },
        },
        async ({ projectId }) => {
            const job = await client.triggerExport(projectId);
            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(job, null, 2),
                    },
                ],
            };
        }
    );
}
