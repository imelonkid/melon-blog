/**
 * 上线前的总闸。任何一项不过就非零退出，deploy 会停在这里。
 *
 *   node scripts/preflight.mjs
 *
 * 检查的都是踩过的坑，不是凭空想的规则：
 *   1. 缺图    —— Obsidian 里挪动附件后链接带上子目录，同步会丢图
 *   2. 断链    —— 正文引用的图在 public/ 里不存在
 *   3. 百分比宽高 —— 老文章的裸 <img width="80%">，会让刷新时页面跳动
 *   4. 未审阅  —— 有正文改动却没过 article-review
 *   5. draft   —— 只本地预览，不该出现在构建产物里
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { ROOT, vaultSrc } from './paths.mjs';

const POSTS = path.join(ROOT, 'src/content/posts');
const PUBLIC = path.join(ROOT, 'public');
const DIST = path.join(ROOT, 'dist');
const REVIEW_STATE = path.join(ROOT, '.article-review.json');
const EXCEPTIONS = path.join(ROOT, '.image-exceptions.json');

// 确认找不回来的老图，见 .image-exceptions.json 里的说明
const excepted = fs.existsSync(EXCEPTIONS)
  ? Object.fromEntries(
      Object.entries(JSON.parse(fs.readFileSync(EXCEPTIONS, 'utf8')))
        .filter(([k]) => !k.startsWith('_'))
        .map(([k, v]) => [k, new Set(v.paths)]),
    )
  : {};

const fail = [];
const warn = [];
const lost = [];   // 例外清单里、确认找不回的老图
const posts = fs.readdirSync(POSTS).filter((f) => f.endsWith('.md'));

// ---- 1 & 2：图片 ----
for (const f of posts) {
  const text = fs.readFileSync(path.join(POSTS, f), 'utf8');

  for (const m of text.matchAll(/<!--\s*缺图：(.+?)\s*-->/g))
    fail.push(`${f}：图片没同步过来 —— ${m[1]}\n      Obsidian 里挪过附件的话，链接会变成 ![[子目录/图.png]]。确认图还在 vault 里，重跑 pnpm run sync`);

  // markdown 和裸 img 两种写法都查
  const refs = [
    ...[...text.matchAll(/!\[[^\]]*\]\((\/[^)\s]+)\)/g)].map((m) => m[1]),
    ...[...text.matchAll(/<img[^>]+src="(\/[^"]+)"/g)].map((m) => m[1]),
  ];
  for (const r of new Set(refs)) {
    const p = path.join(PUBLIC, decodeURIComponent(r));
    if (fs.existsSync(p)) continue;
    if (excepted[f]?.has(r)) { lost.push(`${f}  ${r}`); continue; }
    fail.push(`${f}：图片断链 ${r}（public/ 下找不到）`);
  }

  for (const m of text.matchAll(/<img[^>]*\s(?:width|height)="\d+%"/g))
    fail.push(`${f}：裸 <img> 用了百分比宽高，会导致刷新时跳动。换成真实像素`);
}

// ---- 2.5：正文里不该出现真实主机、账号、密钥 ----
// 只认「长得像主机」的 IP：跟在 @ 后面，或被 ssh/scp/rsync/curl/http 带着，
// 或后面跟端口。否则 "version 1.8.0.10" 这种版本号会误报。
const HOSTISH = /(?:@|ssh\s+|scp\s+[^\n]*?|rsync\s+[^\n]*?|ping\s+|curl\s+[^\n]*?|https?:\/\/)((?:\d{1,3}\.){3}\d{1,3})|((?:\d{1,3}\.){3}\d{1,3}):\d{2,5}\b/g;
const PRIVATE = /^(?:127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|255\.)/;

for (const f of posts) {
  const text = fs.readFileSync(path.join(POSTS, f), 'utf8');
  const hits = new Set(
    [...text.matchAll(HOSTISH)].map((m) => m[1] || m[2]).filter((ip) => ip && !PRIVATE.test(ip)),
  );
  for (const ip of hits)
    fail.push(`${f}：正文里有公网主机 ${ip}。换成 $DEPLOY_HOST 之类的占位`);
  for (const m of text.matchAll(/\b[\w.-]+\.pem\b/g))
    fail.push(`${f}：正文里有私钥文件名 ${m[0]}`);
}

// ---- 2.55：正文里不该残留 Obsidian 注释标记 ----
// %% 注释靠成对出现，注释内容里多一个 %% 就会提前闭合，后半段漏成正文
for (const f of posts) {
  const t = fs.readFileSync(path.join(POSTS, f), 'utf8');
  const n = (t.match(/%%/g) || []).length;
  if (n) fail.push(`${f}：正文里残留 ${n} 处 %%（Obsidian 注释没被完整剥离）。`
    + '通常是注释内容里本身含有 %%，导致注释提前闭合');
}

// ---- 2.6：updated 不能早于 date ----
for (const f of posts) {
  const t = fs.readFileSync(path.join(POSTS, f), 'utf8');
  const d = (t.match(/^date:\s*(\S+)/m) || [])[1];
  const u = (t.match(/^updated:\s*(\S+)/m) || [])[1];
  if (d && u && u < d) fail.push(`${f}：updated (${u}) 早于 date (${d})`);
}

// ---- 2.8：笔记必须已提交 ----
//
// 线上文章由笔记同步生成，笔记才是事实来源。发布前笔记还有未提交的改动，
// 意味着"线上有什么"和"仓库记录了什么"对不上——出问题时无从回溯改了哪一版。
try {
  const vault = process.env.BLOG_VAULT;
  if (vault && fs.existsSync(path.join(vault, '.git'))) {
    const dirty = execSync(`git -C "${vault}" status --porcelain -- "写点东西"`, {
      encoding: 'utf8',
    }).trim();
    if (dirty) {
      const files = dirty.split('\n').map((l) => l.slice(3).replace(/^"|"$/g, ''));
      fail.push(
        `Obsidian 笔记有 ${files.length} 处未提交的改动，先提交再发布：\n`
        + `      git -C "$BLOG_VAULT" add "写点东西" && git -C "$BLOG_VAULT" commit\n`
        + files.slice(0, 5).map((f) => `      · ${f}`).join('\n'),
      );
    }
  }
} catch { /* 笔记目录不是 git 仓库就跳过这项 */ }

// ---- 3：审阅状态 ----
const bodyHash = (t) => {
  const m = t.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/);
  return crypto.createHash('sha1').update((m ? m[1] : t).replace(/\s+/g, ' ').trim()).digest('hex').slice(0, 12);
};
const state = fs.existsSync(REVIEW_STATE) ? JSON.parse(fs.readFileSync(REVIEW_STATE, 'utf8')) : {};
const SRC = vaultSrc();
const walk = (dir, pre = '') =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name.startsWith('.')) return [];
    const rel = pre ? path.join(pre, e.name) : e.name;
    return e.isDirectory() ? walk(path.join(dir, e.name), rel) : e.name.endsWith('.md') ? [rel] : [];
  });

for (const rel of walk(SRC)) {
  const text = fs.readFileSync(path.join(SRC, rel), 'utf8');
  if (!/^publish:\s*true\s*$/m.test(text)) continue;      // 没标发布的不管
  const rec = state[rel];
  if (!rec) fail.push(`${rel}：标了 publish 但从没审阅过。先跑 /article-review`);
  else if (rec.hash !== bodyHash(text)) fail.push(`${rel}：审阅之后正文又改了（${rec.reviewedAt} 审的）。重新跑 /article-review`);
}

// ---- 4：draft 不该进产物 ----
for (const f of posts) {
  if (!/^draft:\s*true\s*$/m.test(fs.readFileSync(path.join(POSTS, f), 'utf8'))) continue;
  const slug = f.replace(/\.md$/, '');
  if (fs.existsSync(path.join(DIST, 'posts', slug)))
    fail.push(`${f}：标了 draft 却出现在 dist/ 里。draft 只在本地 dev 可见，不该上线`);
  else warn.push(`${f}：draft，本地可预览，不会上线`);
}

// ---- 报告 ----
const n = posts.length;
if (warn.length) { console.log(''); warn.forEach((w) => console.log(`  · ${w}`)); }
if (lost.length) console.log(`\n  · ${lost.length} 张老图确认丢失，已在 .image-exceptions.json 记录`);
if (fail.length) {
  console.log(`\n上线前检查未通过（${fail.length} 项）：\n`);
  fail.forEach((f) => console.log(`  ✗ ${f}`));
  console.log('');
  process.exit(1);
}
console.log(`\n  ✓ 上线前检查通过（${n} 篇：图片完整、无断链、已审阅）\n`);
