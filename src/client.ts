/**
 * @module client
 * ParaTranz REST API 客户端，统一处理认证、错误和分页。
 */

import type {
    PaginatedResult,
    Project,
    File,
    StringItem,
    Term,
    History,
    Member,
    Issue,
    Reply,
    Artifact,
    Job,
    User,
    UserProjectMembership,
    Score,
    Revision,
    Stage,
} from "./types.js";

const DEFAULT_BASE_URL = "https://paratranz.cn/api";

/** HTTP 请求选项 */
export interface RequestOptions {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: Record<string, unknown>;
    query?: Record<string, string | number | boolean | undefined>;
}

/**
 * ParaTranz API 客户端
 *
 * 封装所有 ParaTranz REST API 调用，提供类型安全的方法。
 * 通过构造函数传入 API Token 进行认证。
 */
export class ParaTranzClient {
    private token: string;
    private baseUrl: string;

    /**
     * @param token - ParaTranz API Token
     * @param baseUrl - API 基础 URL，默认 `https://paratranz.cn/api`
     */
    constructor(token: string, baseUrl?: string) {
        this.token = token;
        this.baseUrl = baseUrl ?? DEFAULT_BASE_URL;
    }

    /**
     * 发送 HTTP 请求到 ParaTranz API
     * @param path - API 路径（不含 base URL）
     * @param options - 请求选项
     * @returns 解析后的 JSON 响应
     * @throws 当 API 返回非 2xx 状态码时抛出错误
     * @category Internal
     */
    private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
        const { method = "GET", body, query } = options;

        // 构建 URL 及 query 参数
        const url = new URL(`${this.baseUrl}${path}`);
        if (query) {
            for (const [key, value] of Object.entries(query)) {
                if (value !== undefined && value !== null) {
                    url.searchParams.set(key, String(value));
                }
            }
        }

        const headers: Record<string, string> = {
            Authorization: this.token,
            Accept: "application/json",
        };

        const init: RequestInit = { method, headers };

        if (body) {
            headers["Content-Type"] = "application/json";
            init.body = JSON.stringify(body);
        }

        const response = await fetch(url.toString(), init);

        if (!response.ok) {
            let errorMessage: string;
            try {
                const errorBody = (await response.json()) as { message?: string; code?: number };
                errorMessage = errorBody.message ?? `HTTP ${response.status}`;
            } catch {
                errorMessage = `HTTP ${response.status} ${response.statusText}`;
            }
            throw new Error(`ParaTranz API error: ${errorMessage} (${method} ${path})`);
        }

        return (await response.json()) as T;
    }

    /**
     * 获取项目列表，支持按关键词搜索
     * @param options - 分页及筛选选项
     * @category Projects
     */
    async getProjects(
        options: {
            page?: number;
            pageSize?: number;
            filter?: string;
        } = {}
    ): Promise<PaginatedResult<Project>> {
        return this.request<PaginatedResult<Project>>("/projects", {
            query: {
                page: options.page ?? 1,
                pageSize: options.pageSize ?? 50,
                filter: options.filter,
            },
        });
    }

    /**
     * 通过 ID 获取项目详情
     * @param projectId - 项目 ID
     * @category Projects
     */
    async getProject(projectId: number): Promise<Project> {
        return this.request<Project>(`/projects/${projectId}`);
    }

    /**
     * 获取项目文件列表
     * @param projectId - 项目 ID
     * @category Files
     */
    async getFiles(projectId: number): Promise<File[]> {
        return this.request<File[]>(`/projects/${projectId}/files`);
    }

    /**
     * 通过 ID 获取文件详情
     * @param projectId - 项目 ID
     * @param fileId - 文件 ID
     * @category Files
     */
    async getFile(projectId: number, fileId: number): Promise<File> {
        return this.request<File>(`/projects/${projectId}/files/${fileId}`);
    }

    /**
     * 获取项目词条列表，支持按文件和状态筛选
     * @param projectId - 项目 ID
     * @param options - 筛选选项（分页、文件 ID、词条状态）
     * @category Strings
     */
    async getStrings(
        projectId: number,
        options: {
            page?: number;
            pageSize?: number;
            file?: number;
            stage?: Stage;
        } = {}
    ): Promise<PaginatedResult<StringItem>> {
        return this.request<PaginatedResult<StringItem>>(`/projects/${projectId}/strings`, {
            query: {
                page: options.page ?? 1,
                pageSize: options.pageSize ?? 50,
                file: options.file,
                stage: options.stage,
            },
        });
    }

    /**
     * 通过 ID 获取单个词条详情
     * @param projectId - 项目 ID
     * @param stringId - 词条 ID
     * @category Strings
     */
    async getString(projectId: number, stringId: number): Promise<StringItem> {
        return this.request<StringItem>(`/projects/${projectId}/strings/${stringId}`);
    }

    /**
     * 更新词条的翻译、状态或上下文
     * @param projectId - 项目 ID
     * @param stringId - 词条 ID
     * @param data - 要更新的字段
     * @category Strings
     */
    async saveString(
        projectId: number,
        stringId: number,
        data: { translation?: string; stage?: Stage; context?: string }
    ): Promise<StringItem> {
        return this.request<StringItem>(`/projects/${projectId}/strings/${stringId}`, {
            method: "PUT",
            body: data as Record<string, unknown>,
        });
    }

    /**
     * 批量修改或删除词条
     * @param projectId - 项目 ID
     * @param op - 操作类型
     * @param ids - 词条 ID 列表
     * @param data - 批量更新数据（仅 op=update 时有效）
     * @category Strings
     */
    async batchStrings(
        projectId: number,
        op: "update" | "delete",
        ids: number[],
        data?: { stage?: Stage; translation?: string }
    ): Promise<unknown> {
        return this.request(`/projects/${projectId}/strings`, {
            method: "PUT",
            body: { op, id: ids, ...data },
        });
    }

    /**
     * 获取项目术语列表
     * @param projectId - 项目 ID
     * @param page - 页码
     * @param pageSize - 每页数量
     * @category Terms
     */
    async getTerms(
        projectId: number,
        page = 1,
        pageSize = 50
    ): Promise<PaginatedResult<Term>> {
        return this.request<PaginatedResult<Term>>(`/projects/${projectId}/terms`, {
            query: { page, pageSize },
        });
    }

    /**
     * 通过 ID 获取术语详情
     * @param projectId - 项目 ID
     * @param termId - 术语 ID
     * @category Terms
     */
    async getTerm(projectId: number, termId: number): Promise<Term> {
        return this.request<Term>(`/projects/${projectId}/terms/${termId}`);
    }

    /**
     * 创建新术语
     * @param projectId - 项目 ID
     * @param data - 术语数据
     * @category Terms
     */
    async createTerm(
        projectId: number,
        data: {
            term: string;
            translation: string;
            pos?: string;
            note?: string;
            variants?: string[];
            caseSensitive?: boolean;
        }
    ): Promise<Term> {
        return this.request<Term>(`/projects/${projectId}/terms`, {
            method: "POST",
            body: data as Record<string, unknown>,
        });
    }

    /**
     * 修改已有术语
     * @param projectId - 项目 ID
     * @param termId - 术语 ID
     * @param data - 要更新的字段
     * @category Terms
     */
    async saveTerm(
        projectId: number,
        termId: number,
        data: {
            term?: string;
            translation?: string;
            pos?: string;
            note?: string;
            variants?: string[];
            caseSensitive?: boolean;
        }
    ): Promise<Term> {
        return this.request<Term>(`/projects/${projectId}/terms/${termId}`, {
            method: "PUT",
            body: data as Record<string, unknown>,
        });
    }

    /**
     * 删除术语，仅创建者及管理员可删除
     * @param projectId - 项目 ID
     * @param termId - 术语 ID
     * @category Terms
     */
    async deleteTerm(projectId: number, termId: number): Promise<void> {
        await this.request(`/projects/${projectId}/terms/${termId}`, {
            method: "DELETE",
        });
    }

    /**
     * 获取项目历史记录，支持按用户、词条、类型筛选
     * @param projectId - 项目 ID
     * @param options - 筛选选项
     * @category History
     */
    async getHistory(
        projectId: number,
        options: {
            page?: number;
            pageSize?: number;
            uid?: number;
            tid?: number;
            type?: "text" | "term" | "import" | "comment";
        } = {}
    ): Promise<PaginatedResult<History>> {
        return this.request<PaginatedResult<History>>(`/projects/${projectId}/history`, {
            query: {
                page: options.page ?? 1,
                pageSize: options.pageSize ?? 50,
                uid: options.uid,
                tid: options.tid,
                type: options.type,
            },
        });
    }

    /**
     * 获取文件修订历史
     * @param projectId - 项目 ID
     * @param options - 筛选选项（文件 ID、修订类型）
     * @category History
     */
    async getFileRevisions(
        projectId: number,
        options: {
            page?: number;
            pageSize?: number;
            file?: number;
            type?: "create" | "update" | "import";
        } = {}
    ): Promise<PaginatedResult<Revision>> {
        return this.request<PaginatedResult<Revision>>(`/projects/${projectId}/files/revisions`, {
            query: {
                page: options.page ?? 1,
                pageSize: options.pageSize ?? 50,
                file: options.file,
                type: options.type,
            },
        });
    }

    /**
     * 获取项目成员列表
     * @param projectId - 项目 ID
     * @category Members
     */
    async getMembers(projectId: number): Promise<Member[]> {
        return this.request<Member[]>(`/projects/${projectId}/members`);
    }

    /**
     * 获取项目讨论列表
     * @param projectId - 项目 ID
     * @param status - 按状态筛选: 0=讨论中, 1=已关闭
     * @category Issues
     */
    async getIssues(
        projectId: number,
        status?: 0 | 1
    ): Promise<PaginatedResult<Issue>> {
        return this.request<PaginatedResult<Issue>>(`/projects/${projectId}/issues`, {
            query: { status },
        });
    }

    /**
     * 通过 ID 获取讨论详情
     * @param projectId - 项目 ID
     * @param issueId - 讨论 ID
     * @category Issues
     */
    async getIssue(projectId: number, issueId: number): Promise<Issue> {
        return this.request<Issue>(`/projects/${projectId}/issues/${issueId}`);
    }

    /**
     * 创建新讨论
     * @param projectId - 项目 ID
     * @param data - 讨论标题和内容
     * @category Issues
     */
    async createIssue(
        projectId: number,
        data: { title: string; content: string }
    ): Promise<Issue> {
        return this.request<Issue>(`/projects/${projectId}/issues`, {
            method: "POST",
            body: data,
        });
    }

    /**
     * 回复讨论
     * @param projectId - 项目 ID
     * @param issueId - 讨论 ID
     * @param content - 回复内容（支持 Markdown）
     * @category Issues
     */
    async replyIssue(
        projectId: number,
        issueId: number,
        content: string
    ): Promise<Reply> {
        return this.request<Reply>(`/projects/${projectId}/issues/${issueId}`, {
            method: "POST",
            body: { op: "reply", content },
        });
    }

    /**
     * 获取最近一次导出的结果
     * @param projectId - 项目 ID
     * @category Artifacts
     */
    async getArtifact(projectId: number): Promise<Artifact> {
        return this.request<Artifact>(`/projects/${projectId}/artifacts`);
    }

    /**
     * 手动触发导出操作，仅管理员可用
     * @param projectId - 项目 ID
     * @returns 导出任务信息
     * @category Artifacts
     */
    async triggerExport(projectId: number): Promise<Job> {
        return this.request<Job>(`/projects/${projectId}/artifacts`, {
            method: "POST",
        });
    }

    /**
     * 通过 ID 获取用户信息
     * @param userId - 用户 ID
     * @category Users
     */
    async getUser(userId: number): Promise<User> {
        return this.request<User>(`/users/${userId}`);
    }

    /**
     * 获取用户参与的所有项目（含权限和项目摘要）
     *
     * 注意：此接口未在官方文档中列出，但实际可用。
     * @param userId - 用户 ID
     * @category Users
     */
    async getUserProjects(userId: number): Promise<UserProjectMembership[]> {
        return this.request<UserProjectMembership[]>(`/users/${userId}/projects`);
    }

    /**
     * 按关键词搜索用户
     *
     * 注意：此接口未在官方文档中列出，但实际可用。
     * @param keyword - 搜索关键词（用户名模糊匹配）
     * @category Users
     */
    async searchUsers(keyword: string): Promise<PaginatedResult<User>> {
        return this.request<PaginatedResult<User>>("/users", {
            query: { keyword },
        });
    }

    /**
     * 获取项目成员贡献列表
     *
     * 贡献值(PP)计算公式: `1×翻译词数 + 0.5×编辑词数 + 0.2×审核词数`
     *
     * @param projectId - 项目 ID
     * @param options - 筛选选项（用户、操作类型、时间范围）
     * @category Scores
     */
    async getScores(
        projectId: number,
        options: {
            page?: number;
            pageSize?: number;
            uid?: number;
            operation?: "translate" | "edit" | "review";
            start?: string;
            end?: string;
        } = {}
    ): Promise<PaginatedResult<Score>> {
        return this.request<PaginatedResult<Score>>(`/projects/${projectId}/scores`, {
            query: {
                page: options.page ?? 1,
                pageSize: options.pageSize ?? 50,
                uid: options.uid,
                operation: options.operation,
                start: options.start,
                end: options.end,
            },
        });
    }
}
