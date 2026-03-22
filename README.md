# ParaTranz MCP Server

让 LLM 能直接操作你的 ParaTranz 项目。

## 功能

通过 20 个 MCP Tools 覆盖 ParaTranz 核心 API：

| 分类 | 工具 | 说明 |
|------|------|------|
| **项目** | `list_projects` / `get_project` | 项目列表与详情 |
| **文件** | `list_files` / `get_file` | 文件列表与翻译进度 |
| **词条** | `list_strings` / `get_string` / `update_string` / `batch_update_strings` | 词条搜索、翻译、批量操作 |
| **术语** | `list_terms` / `get_term` / `create_term` / `update_term` / `delete_term` | 术语表 CRUD |
| **历史** | `get_history` | 翻译/编辑历史记录 |
| **成员** | `list_members` | 项目成员与权限 |
| **讨论** | `list_issues` / `get_issue` / `create_issue` / `reply_to_issue` | 项目讨论管理 |
| **导出** | `get_export_status` / `trigger_export` | 翻译包导出 |
| **用户** | `get_user` | 用户信息 |
| **贡献** | `get_scores` | 成员贡献统计 |

## 安装

```bash
git clone <repo-url>
cd paratranz-mcp
npm install
npm run build
```

## 配置

### 获取 API Token

在 ParaTranz [个人资料页面](https://paratranz.cn) 的设置选项卡中获取 API Token。

### Claude Desktop

编辑 `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "paratranz": {
      "command": "node",
      "args": ["/absolute/path/to/paratranz-mcp/dist/index.js"],
      "env": {
        "PARATRANZ_TOKEN": "your_token_here"
      }
    }
  }
}
```

### Gemini CLI

编辑 `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "paratranz": {
      "command": "node",
      "args": ["/absolute/path/to/paratranz-mcp/dist/index.js"],
      "env": {
        "PARATRANZ_TOKEN": "your_token_here"
      }
    }
  }
}
```

## 开发

```bash
# 监听模式编译
npm run dev

# 使用 MCP Inspector 测试
npx @modelcontextprotocol/inspector node dist/index.js
```
