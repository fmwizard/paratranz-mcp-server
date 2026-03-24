#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ParaTranzClient } from "./client.js";
import { registerProjectTools } from "./tools/projects.js";
import { registerFileTools } from "./tools/files.js";
import { registerStringTools } from "./tools/strings.js";
import { registerTermTools } from "./tools/terms.js";
import { registerHistoryTools } from "./tools/history.js";
import { registerMemberTools } from "./tools/members.js";
import { registerIssueTools } from "./tools/issues.js";
import { registerArtifactTools } from "./tools/artifacts.js";
import { registerUserTools } from "./tools/users.js";
import { registerScoreTools } from "./tools/scores.js";
import { registerSummaryTools } from "./tools/summary.js";

// ----- Token 获取 -----

function getToken(): string {
    // 优先从环境变量获取
    const token = process.env.PARATRANZ_TOKEN;
    if (!token) {
        console.error(
            "错误: 未设置 PARATRANZ_TOKEN 环境变量。\n" +
            "请在 ParaTranz 个人资料页面获取 API Token，然后设置环境变量：\n" +
            "  export PARATRANZ_TOKEN=your_token_here\n" +
            "或在 MCP 客户端配置中通过 env 字段设置。"
        );
        process.exit(1);
    }
    return token;
}

// ----- 主函数 -----

async function main() {
    const token = getToken();
    const client = new ParaTranzClient(token);

    // 创建 MCP Server 实例
    const server = new McpServer({
        name: "paratranz",
        version: "0.1.0",
    });

    // 注册所有工具
    registerProjectTools(server, client);
    registerFileTools(server, client);
    registerStringTools(server, client);
    registerTermTools(server, client);
    registerHistoryTools(server, client);
    registerMemberTools(server, client);
    registerIssueTools(server, client);
    registerArtifactTools(server, client);
    registerUserTools(server, client);
    registerScoreTools(server, client);
    registerSummaryTools(server, client);

    // 启动 STDIO 传输
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error("ParaTranz MCP Server 已启动 (stdio 模式)");
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
