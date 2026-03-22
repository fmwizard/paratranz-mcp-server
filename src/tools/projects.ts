// Projects 工具 - 项目列表与详情

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ParaTranzClient } from "../client.js";

export function registerProjectTools(server: McpServer, client: ParaTranzClient) {
    server.registerTool(
        "list_projects",
        {
            description: "获取 ParaTranz 项目列表",
            inputSchema: {
                page: z.number().int().min(1).default(1).describe("页码，默认 1"),
                pageSize: z.number().int().min(1).max(800).default(50).describe("每页数量，默认 50"),
            },
        },
        async ({ page, pageSize }) => {
            const result = await client.getProjects(page, pageSize);
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
        "get_project",
        {
            description: "通过 ID 获取 ParaTranz 项目详细信息",
            inputSchema: {
                projectId: z.number().int().min(1).describe("项目 ID"),
            },
        },
        async ({ projectId }) => {
            const project = await client.getProject(projectId);
            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(project, null, 2),
                    },
                ],
            };
        }
    );
}
