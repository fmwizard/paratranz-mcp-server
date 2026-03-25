// Summary Markdown 格式化

import type { TranslationSummary } from "../types.js";

/**
 * 将 TranslationSummary 格式化为 Markdown 字符串。
 * - detail="overview" 时只输出概览统计表
 * - detail="full" 时输出每用户的完整词条明细
 */
export function formatSummaryMarkdown(
    summary: TranslationSummary,
    detail: "overview" | "full"
): string {
    const lines: string[] = [];

    // 概览头部
    lines.push(`# 翻译汇总 ${summary.date}`);
    lines.push("");
    lines.push(`- **项目 ID：** ${summary.projectId}`);
    lines.push(`- **时区：** ${summary.timezone}`);
    lines.push(`- **总记录数：** ${summary.totalEntries}`);
    lines.push(`- **唯一词条数：** ${summary.totalUniqueKeys}`);
    lines.push(`- **活跃成员：** ${summary.users.length}`);
    lines.push("");

    // 成员统计表
    lines.push("## 成员统计");
    lines.push("");
    lines.push("| 成员 | UID | 词条数 | 新翻译 | 编辑 | 审核 |");
    lines.push("|------|-----|--------|--------|------|------|");
    for (const user of summary.users) {
        lines.push(
            `| ${user.username} | ${user.uid} | ${user.uniqueKeys} | ${user.newTranslations} | ${user.edits} | ${user.reviews} |`
        );
    }

    if (detail === "overview") {
        return lines.join("\n");
    }

    // detail=full: 每用户词条明细
    for (const user of summary.users) {
        lines.push("");
        lines.push(`## ${user.username} (UID: ${user.uid})`);
        lines.push("");
        lines.push(
            `新翻译: ${user.newTranslations} | 编辑: ${user.edits} | 审核: ${user.reviews} | 词条数: ${user.uniqueKeys}`
        );

        for (const entry of user.translations) {
            lines.push("");
            lines.push(`### ${entry.key} [${entry.operation}]`);
            lines.push(`- **原文：** ${entry.original}`);
            lines.push(`- **译文：** ${entry.translation}`);

            // 仅多次修订时展示修订链
            if (entry.revisions.length > 1) {
                lines.push("- **修订：**");
                for (const rev of entry.revisions) {
                    const time = formatTime(rev.time);
                    lines.push(
                        `  - ${time} [${rev.operation}] ${JSON.stringify(rev.from)} → ${JSON.stringify(rev.to)}`
                    );
                }
            }
        }
    }

    return lines.join("\n");
}

/** 从 ISO 时间戳提取 HH:MM 部分 */
function formatTime(isoTime: string): string {
    try {
        const d = new Date(isoTime);
        return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
    } catch {
        return isoTime;
    }
}
