/**
 * @module types
 * ParaTranz MCP Server TypeScript 类型定义
 * 基于 ParaTranz OpenAPI v0.5.0
 */

/** 通用分页响应结构 @category Common */
export interface PaginatedResult<T> {
    page: number;
    pageSize: number;
    rowCount: number;
    pageCount: number;
    results: T[];
}



/**
 * 词条状态
 *  0 - 未翻译
 *  1 - 已翻译
 *  2 - 有疑问
 *  3 - 已检查
 *  5 - 已审核
 *  9 - 已锁定
 * -1 - 已隐藏
 */
export type Stage = 0 | 1 | 2 | 3 | 5 | 9 | -1;

/** Stage 枚举对应的中文标签 @category Enums */
export const StageLabels: Record<Stage, string> = {
    0: "未翻译",
    1: "已翻译",
    2: "有疑问",
    3: "已检查",
    5: "已审核",
    9: "已锁定",
    [-1]: "已隐藏",
};

/**
 * 权限
 *  1 - 翻译者
 *  2 - 校对者
 *  3 - 管理员
 * 10 - 所有者
 */
export type Permission = 1 | 2 | 3 | 10;

/** Permission 枚举对应的中文标签 @category Enums */
export const PermissionLabels: Record<Permission, string> = {
    1: "翻译者",
    2: "校对者",
    3: "管理员",
    10: "所有者",
};

/** 用户信息简略版 @category Users */
export interface TinyUser {
    id: number;
    username: string;
    nickname: string;
    avatar?: string;
    lastVisit?: string;
}

/** 用户完整信息 @category Users */
export interface User {
    id: number;
    createdAt: string;
    updatedAt: string;
    lastVisit?: string;
    username: string;
    nickname: string;
    bio?: string;
    avatar?: string;
    email?: string;
    credit: number;
    translated: number;
    edited: number;
    reviewed: number;
    commented: number;
    points: number;
}

/** 项目信息 @category Projects */
export interface Project {
    id: number;
    createdAt: string;
    updatedAt?: string;
    uid: number;
    user?: Record<string, unknown>;
    name: string;
    logo?: string;
    desc?: string;
    source: string;
    dest: string;
    members: number;
    game?: string;
    license?: string;
    activeLevel?: number;
    stage?: number;
    privacy?: number;
    download?: number;
    issueMode?: number;
    reviewMode?: number;
    joinMode?: number;
}

/**
 * 用户参与的项目（成员视角）
 *
 * 来自未文档化的 `GET /users/{userId}/projects` 接口，
 * 返回用户作为成员参与的所有项目，含权限和项目摘要。
 * @category Projects
 */
export interface UserProjectMembership {
    id: number;
    createdAt: string;
    uid: number;
    project: {
        id: number;
        name: string;
        logo?: string;
        stage?: number;
        privacy?: number;
    };
    permission: Permission;
    privacy?: number;
    game?: string;
    rank?: number;
    suggest?: number;
}

/** 文件信息简略版 @category Files */
export interface TinyFile {
    id: number;
    name: string;
    project: number;
}

/** 文件完整信息（含翻译进度统计） @category Files */
export interface File {
    id: number;
    createdAt: string;
    updatedAt: string;
    modifiedAt: string;
    name: string;
    project: number;
    format?: string;
    total: number;
    translated: number;
    disputed: number;
    checked: number;
    reviewed: number;
    hidden: number;
    locked: number;
    words: number;
    hash?: string;
}

/** 词条（翻译条目） @category Strings */
export interface StringItem {
    id: number;
    createdAt: string;
    updatedAt: string;
    key: string;
    original: string;
    translation: string;
    file?: TinyFile;
    fileId: number;
    stage: Stage;
    project: number;
    uid?: number;
    context?: string;
    words: number;
    user?: TinyUser;
}

/** 术语 @category Terms */
export interface Term {
    id: number;
    createdAt: string;
    updatedAt: string;
    updatedBy?: number;
    pos?: "noun" | "verb" | "adj" | "adv";
    uid?: number;
    term: string;
    translation: string;
    note?: string;
    project?: number;
    variants?: string[];
    caseSensitive?: boolean;
}

/** 历史记录操作类型 @category History */
export type HistoryOperation =
    | "translate"
    | "edit"
    | "reset"
    | "dispute"
    | "review"
    | "rollback"
    | "lock"
    | "hide";

/** 词条历史记录 @category History */
export interface History {
    id: number;
    createdAt: string;
    field?: string;
    uid?: number;
    user?: TinyUser;
    tid?: number;
    from?: string;
    to?: string;
    target?: {
        key?: string;
        original?: string;
        translation?: string;
        stage?: number;
    };
    operation?: HistoryOperation;
}

/** 术语修改历史 @category History */
export interface TermHistory {
    id: number;
    createdAt: string;
    field?: string;
    uid?: number;
    tid?: number;
    from?: string;
    to?: string;
    target?: {
        pos?: string;
        term?: string;
        translation?: string;
        note?: string;
        variants?: string[];
    };
    operation?: string;
}

/** 项目成员 @category Members */
export interface Member {
    id: number;
    createdAt: string;
    updatedAt: string;
    uid: number;
    user?: User;
    project: number;
    permission: Permission;
    totalPoints?: number;
    translated?: number;
    edited?: number;
    reviewed?: number;
    note?: string;
}

/** 文件上传/更新记录 @category History */
export interface Revision {
    id: number;
    createdAt: string;
    name: string;
    filename?: string;
    type: "create" | "update" | "import";
    file: number;
    uid?: number;
    project: number;
    insert?: number;
    update?: number;
    remove?: number;
    hash?: string;
    force?: boolean;
    incremental?: boolean;
}

/** 导出结果 @category Artifacts */
export interface Artifact {
    id: number;
    createdAt: string;
    project: number;
    total: number;
    translated: number;
    disputed: number;
    reviewed: number;
    hidden: number;
    duration?: number;
}

/** 导出任务信息 @category Artifacts */
export interface Job {
    id: number;
    createdAt: string;
    startedAt?: string;
    finishedAt?: string;
    scheduledAt?: string;
    params?: Record<string, unknown>;
    project: number;
    uid?: number;
    type?: string;
    status: number; // 0=未开始, 1=执行中, 2=成功, -1=失败
    result?: Record<string, unknown>;
}

/** 讨论主题 @category Issues */
export interface Issue {
    id: number;
    createdAt: string;
    updatedAt?: string;
    project: number;
    uid?: number;
    parent?: number;
    title?: string;
    content: string;
    html?: string;
    status?: number; // 0=讨论中, 1=已关闭
    lastEdit?: number;
    refer?: number[];
}

/** 讨论回复 @category Issues */
export interface Reply {
    id: number;
    createdAt: string;
    updatedAt?: string;
    project: number;
    uid?: number;
    parent?: number;
    content: string;
    html?: string;
    lastEdit?: number;
    refer?: number[];
}

/** 成员贡献记录 @category Scores */
export interface Score {
    id: number;
    createdAt: string;
    project: number;
    uid?: number;
    base: number;
    multiplier: number;
    value: number;
}

/** 用户动态（词条相关活动） @category Users */
export interface UserActivity {
    id: number;
    createdAt: string;
    projectId: number;
    stringId: number;
    historyId: number;
    history?: History;
}

/** 翻译条目明细（用于每日汇总） @category Summary */
export interface TranslationEntry {
    key: string;
    original: string;
    translation: string;
    operation: string;
    previousTranslation?: string;
}

/** 单个用户的翻译汇总 @category Summary */
export interface UserTranslationSummary {
    uid: number;
    username: string;
    newTranslations: number;
    edits: number;
    uniqueKeys: number;
    translations: TranslationEntry[];
}

/** 每日翻译汇总 @category Summary */
export interface TranslationSummary {
    date: string;
    projectId: number;
    totalEntries: number;
    totalUniqueKeys: number;
    users: UserTranslationSummary[];
}
