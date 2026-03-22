// Members 工具 - 成员查看

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ParaTranzClient } from "../client.js";

export function registerMemberTools(server: McpServer, client: ParaTranzClient) {
    server.registerTool(
        "list_members",
        {
            description:
                "获取项目成员列表，包含每个成员的权限、贡献统计等。" +
                "权限: 1=翻译者, 2=校对者, 3=管理员, 10=所有者",
            inputSchema: {
                projectId: z.number().int().min(1).describe("项目 ID"),
            },
        },
        async ({ projectId }) => {
            const members = await client.getMembers(projectId);
            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(members, null, 2),
                    },
                ],
            };
        }
    );
}
