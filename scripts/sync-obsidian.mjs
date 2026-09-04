/**
 * 把 Obsidian 里写好的文章同步到博客。
 *
 *   pnpm run sync
 *
 * 只同步 frontmatter 里 publish: true 的笔记——同一个文件夹里的草稿
 * 不会被误发。之前同步过、现在取消了 publish 的，会从博客里移除。
 *
 * Obsidian 专有语法（双链、嵌入图、callout、%%注释%%）会被转换或剥离，
 * 否则会原样漏到网页上。
 */
import fs from 'node:fs';
import path from 'node:path';

const VAULT = '/Users/melonkid/Documents/Knowledge/Notes/Notes/Obsidian/melonkid';
const SRC_DIR = path.join(VAULT, '写点东西');
const ROOT = path.resolve(import.meta.dirname, '..');
const POSTS_DIR = path.join(ROOT, 'src/content/posts');
const IMG_DIR = path.join(ROOT, 'public/images/notes');
const MANIFEST = path.join(ROOT, '.obsidian-sync.json');

const log = (...a) => console.log(' ', ...a);

/** 标签校验。白名单从 src/tags.ts 读，避免两处维护 */
const TAG_SRC = fs.readFileSync(path.join(ROOT, 'src/tags.ts'), 'utf8');
const ALLOWED = [...TAG_SRC.matchAll(/'([^']+)',/g)].map((m) => m[1]);
const tagWidth = (t) => [...t].reduce((n, c) => n + (/[一-鿿]/.test(c) ? 2 : 1), 0);
function checkTagLocal(tag) {
  const w = tagWidth(tag);
  if (w > 8) return `标签「${tag}」宽度 ${w} 超过上限 8（汉字算 2，最多 4 个汉字），未同步`;
  if (!ALLOWED.includes(tag))
    return `标签「${tag}」不在白名单，未同步。先确认现有标签能否覆盖；确实要新增就改 src/tags.ts。现有：${ALLOWED.join('、')}`;
  return null;
}

/** 极简 frontmatter 解析：够用即可，不引依赖 */
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: text };
  const data = {};
  let key = null;
  for (const raw of m[1].split('\n')) {
    const line = raw.replace(/\s+$/, '');
    const listItem = line.match(/^\s*-\s+(.*)$/);
    if (listItem && key) {
      (data[key] ||= []).push(unquote(listItem[1]));
      continue;
    }
    const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!kv) continue;
    key = kv[1];
    const v = kv[2].trim();
    if (v === '') data[key] = [];
    else if (v.startsWith('[') && v.endsWith(']'))
      data[key] = v.slice(1, -1).split(',').map((s) => unquote(s.trim())).filter(Boolean);
    else data[key] = unquote(v);
  }
  return { data, body: m[2] };
}
const unquote = (s) => s.replace(/^["']|["']$/g, '');
const truthy = (v) => v === true || v === 'true' || v === 'yes';

/** 找 vault 里的附件（Obsidian 的 ![[图.png]] 不带路径） */
function findAttachment(name) {
  const stack = [VAULT];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      if (e.name.startsWith('.')) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.name === name) return full;
    }
  }
  return null;
}

/** 转换 Obsidian 专有语法 */
function transform(body, slug, warn) {
  let out = body;

  // %%注释%% —— 只给自己看的，删掉
  out = out.replace(/%%[\s\S]*?%%/g, '');

  // ![[图片.png]] / ![[图片.png|说明]] → 复制附件并改成标准 markdown
  out = out.replace(/!\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g, (whole, file, alt) => {
    const src = findAttachment(file.trim());
    if (!src) { warn(`附件找不到：${file.trim()}`); return `<!-- 缺图：${file.trim()} -->`; }
    fs.mkdirSync(IMG_DIR, { recursive: true });
    const ext = path.extname(src);
    const target = `${slug}-${path.basename(src, ext).replace(/[^\w一-鿿-]/g, '')}${ext}`;
    fs.copyFileSync(src, path.join(IMG_DIR, target));
    return `![${(alt || '').trim()}](/images/notes/${target})`;
  });

  // [[双链]] / [[双链|别名]] → 博客上无处可跳，退化成纯文本
  out = out.replace(/\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g, (_w, target, alias) => (alias || target).trim());

  // > [!note] 标题  →  普通引用（Astro 不认 callout 语法）
  out = out.replace(/^>\s*\[!\w+\][-+]?\s*(.*)$/gm, (_w, t) => (t ? `> **${t}**` : '>'));

  return out.trim() + '\n';
}

/** 递归列出所有 .md（相对 SRC_DIR 的路径），子目录里的文章也要能同步 */
function listMarkdown(dir, prefix = '') {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const rel = prefix ? path.join(prefix, e.name) : e.name;
    if (e.isDirectory()) out.push(...listMarkdown(path.join(dir, e.name), rel));
    else if (e.name.endsWith('.md')) out.push(rel);
  }
  return out.sort();
}

function run() {
  if (!fs.existsSync(SRC_DIR)) { console.error(`目录不存在：${SRC_DIR}`); process.exit(1); }

  const prev = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : [];
  const written = [];
  const warnings = [];
  let skipped = 0;

  for (const file of listMarkdown(SRC_DIR)) {
    const text = fs.readFileSync(path.join(SRC_DIR, file), 'utf8');
    const { data, body } = parseFrontmatter(text);

    if (!truthy(data.publish)) { skipped++; continue; }

    const name = path.basename(file, '.md');
    const title = data.title || name;
    const date = String(data.date || data.created || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      warnings.push(`${file}：缺少可用的 date/created，已跳过`);
      continue;
    }
    const slug = data.slug || name;
    const tags = Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [];
    const tag = data.tag || tags[0] || '随笔';
    // 标签卡控前移到同步阶段：在这里报错，用户改完再构建，
    // 比等 astro build 失败少一轮往返
    const tagError = checkTagLocal(tag);
    if (tagError) { warnings.push(`${file}：${tagError}`); continue; }

    const warn = (m) => warnings.push(`${file}：${m}`);
    const out = [
      '---',
      `title: ${JSON.stringify(title)}`,
      `date: ${date}`,
      `tag: ${JSON.stringify(tag)}`,
      ...(data.excerpt ? [`excerpt: ${JSON.stringify(data.excerpt)}`] : []),
      '---',
      '',
      transform(body, slug, warn),
    ].join('\n');

    const outName = `${date}-${slug}.md`;
    fs.writeFileSync(path.join(POSTS_DIR, outName), out);
    written.push(outName);
    log(`✓ ${file}  →  ${outName}`);
  }

  // 取消发布的，从博客移除
  for (const old of prev) {
    if (!written.includes(old)) {
      const p = path.join(POSTS_DIR, old);
      if (fs.existsSync(p)) { fs.unlinkSync(p); log(`− 已取消发布，移除 ${old}`); }
    }
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(written.sort(), null, 2) + '\n');

  log('');
  log(`同步 ${written.length} 篇，跳过 ${skipped} 篇（未标记 publish: true）`);
  if (warnings.length) { log(''); log('注意：'); warnings.forEach((w) => log('  ! ' + w)); }
}

run();
