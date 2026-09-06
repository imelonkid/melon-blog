/**
 * 笔记仓库的 git 操作。
 *
 * 发布基线用 tag 表示：每次成功上线后打一个 `pub/YYYYMMDD-N`。
 * 「最新的 tag → 现在」之间的差异，就是还没审、还没发的增量。
 *
 * 为什么用 tag 而不是只靠 .article-review.json：
 * 哈希文件记的是"这篇我看过了"，tag 记的是"这个状态已经上线了"。
 * 后者才是回答"线上和本地差在哪"的依据——审阅要审的正是这段差异。
 */
import { execFileSync } from 'node:child_process';
import { need } from './paths.mjs';

export const SUBPATH = '写点东西';

export function git(...args) {
  return execFileSync(
    'git',
    ['-C', need('BLOG_VAULT', 'Obsidian vault 根目录'), '-c', 'core.quotepath=false', ...args],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  );
}

/** 最近一次发布的 tag，没有则返回 null */
export function latestPubTag() {
  try {
    const tags = git('tag', '--list', 'pub/*', '--sort=-creatordate')
      .trim().split('\n').filter(Boolean);
    return tags[0] ?? null;
  } catch { return null; }
}

/** 生成下一个发布 tag 名。同一天多次发布就往后排 */
export function nextPubTag(date = new Date()) {
  const day = date.toLocaleDateString('sv').replace(/-/g, '');
  let existing = [];
  try {
    existing = git('tag', '--list', `pub/${day}-*`).trim().split('\n').filter(Boolean);
  } catch { /* 没有就当空 */ }
  return `pub/${day}-${existing.length + 1}`;
}

/** 自上次发布以来改动过的笔记（相对 SUBPATH 的路径） */
export function changedSince(ref) {
  const out = new Set();
  if (ref) {
    for (const l of git('diff', '--name-only', ref, 'HEAD', '--', SUBPATH).split('\n')) {
      if (l.trim()) out.add(l.trim().replace(new RegExp(`^${SUBPATH}/`), ''));
    }
  }
  // 还没提交的也算增量
  for (const l of git('status', '--porcelain', '--', SUBPATH).split('\n')) {
    const p = l.slice(3).trim().replace(/^"|"$/g, '');
    if (p) out.add(p.replace(new RegExp(`^${SUBPATH}/`), ''));
  }
  return [...out].filter((f) => f.endsWith('.md')).sort();
}

/** 工作区有没有未提交的笔记改动 */
export function isDirty() {
  return git('status', '--porcelain', '--', SUBPATH).trim().length > 0;
}
