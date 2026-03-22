// Users 工具 - 用户信息查看

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ParaTranzClient } from "../client.js";

export function registerUserTools(server: McpServer, client: ParaTranzClient) {
    server.registerTool(
        "get_user",
        {
            description: "通过 ID 获取用户信息，包含翻译统计、贡献值等",
            inputSchema: {
                userId: z.number().int().min(1).describe("用户 ID"),
            },
        },
        async ({ userId }) => {
            const user = await client.getUser(userId);
            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(user, null, 2),
                    },
                ],
            };
        }
    );

    server.registerTool(
        "search_users",
        {
            description:
                "按关键词搜索 ParaTranz 用户。可用于查找用户 ID，" +
                "配合 get_user_projects 获取该用户参与的项目。",
            inputSchema: {
                keyword: z.string().min(1).describe("搜索关键词（用户名模糊匹配）"),
            },
        },
        async ({ keyword }) => {
            const result = await client.searchUsers(keyword);
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
