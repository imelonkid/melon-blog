/**
 * 找出「需要审阅」的文章——只挑新增的和改过的，已审过且未改动的跳过。
 *
 *   node scripts/review-scan.mjs            列出待审文章
 *   node scripts/review-scan.mjs --all      忽略记录，全部列出
 *   node scripts/review-scan.mjs --mark A B 把这些文件记为「已审阅当前版本」
 *   node scripts/review-scan.mjs --status   看整体状态
 *
 * 判定依据是正文内容的 SHA-1。改一个字哈希就变，会被重新挑出来；
 * 只动 frontmatter（比如把 publish 改成 true）不触发重审。
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { vaultSrc } from './paths.mjs';
import { latestPubTag, changedSince, isDirty } from './vault.mjs';

const SRC_DIR = vaultSrc();
const STATE = path.resolve(import.meta.dirname, '../.article-review.json');

const loadState = () =>
  fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {};
const saveState = (s) =>
  fs.writeFileSync(STATE, JSON.stringify(s, null, 2) + '\n');

/** 只对正文做哈希，frontmatter 改动不算内容变化 */
function bodyHash(text) {
  const m = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/);
  const body = (m ? m[1] : text).replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha1').update(body).digest('hex').slice(0, 12);
}

function listFiles() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`目录不存在：${SRC_DIR}`);
    process.exit(1);
  }
  const walk = (dir, prefix = '') => {
    const out = [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.')) continue;
      const rel = prefix ? path.join(prefix, e.name) : e.name;
      if (e.isDirectory()) out.push(...walk(path.join(dir, e.name), rel));
      else if (e.name.endsWith('.md')) out.push(rel);
    }
    return out;
  };
  return walk(SRC_DIR).sort();
}


/**
 * 已经上线过的文章，正文改了就把 updated 写回 Obsidian 的 frontmatter。
 *
 * 为什么不改 date：date 是发表日，决定首页排序和 RSS 的 pubDate。改它会让
 * 老文章跳回首页顶部、让订阅者收到一次重复推送——等于骗读者。所以发表日
 * 定死，实质修改单独记在 updated。
 *
 * 只对「已上线过」的文章生效：还没发布的草稿改来改去是常态，不算更新。
 */
function touchUpdated(rel, full) {
  const manifest = path.resolve(import.meta.dirname, '../.obsidian-sync.json');
  const text = fs.readFileSync(full, 'utf8');
  const m = text.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n)/);
  if (!m) return null;
  const [, open, fm, close] = m;

  if (!/^publish:\s*true\s*$/m.test(fm)) return null;      // 没发布的不算更新

  // 上线过吗？同步产物文件名是 <date>-<slug>.md
  const date = (fm.match(/^date:\s*(\S+)/m) || [])[1];
  const slug = (fm.match(/^slug:\s*(\S+)/m) || [])[1];
  const live = fs.existsSync(manifest) ? JSON.parse(fs.readFileSync(manifest, 'utf8')) : [];
  if (!live.some((f) => date && f.startsWith(date) && (!slug || f.includes(slug)))) return null;

  const today = new Date().toISOString().slice(0, 10);
  if (new RegExp(`^updated:\\s*${today}\\s*$`, 'm').test(fm)) return null;   // 今天已经记过

  const newFm = /^updated:\s*.*$/m.test(fm)
    ? fm.replace(/^updated:\s*.*$/m, `updated: ${today}`)
    : fm.replace(/^(date:\s*\S+)$/m, `$1\nupdated: ${today}`);

  fs.writeFileSync(full, text.replace(open + fm + close, open + newFm + close));
  return today;
}

const args = process.argv.slice(2);
const state = loadState();

if (args[0] === '--mark') {
  const marked = [];
  for (const name of args.slice(1)) {
    const file = name;
    const full = path.join(SRC_DIR, file);
    if (!fs.existsSync(full)) { console.error(`  找不到 ${file}`); continue; }
    const changed = state[file] && state[file].hash !== bodyHash(fs.readFileSync(full, 'utf8'));
    if (changed) {
      const day = touchUpdated(file, full);
      if (day) console.log(`  · ${file} 正文有改动，已在 Obsidian 里记 updated: ${day}`);
    }
    state[file] = { hash: bodyHash(fs.readFileSync(full, 'utf8')), reviewedAt: new Date().toISOString().slice(0, 10) };
    marked.push(file);
  }
  saveState(state);
  console.log(`已记录 ${marked.length} 篇为「已审阅」：${marked.join('、') || '无'}`);
  process.exit(0);
}

const files = listFiles();
const rows = files.map((f) => {
  const h = bodyHash(fs.readFileSync(path.join(SRC_DIR, f), 'utf8'));
  const prev = state[f];
  const status = !prev ? '新增' : prev.hash !== h ? '已改动' : '未变';
  return { file: f, status, reviewedAt: prev?.reviewedAt ?? null };
});

if (args[0] === '--status') {
  console.log(`共 ${rows.length} 篇\n`);
  for (const r of rows) {
    console.log(`  ${r.status.padEnd(4)}  ${r.file}${r.reviewedAt ? `  （上次审阅 ${r.reviewedAt}）` : ''}`);
  }
  const stale = Object.keys(state).filter((f) => !files.includes(f));
  if (stale.length) console.log(`\n  记录中已不存在的文件：${stale.join('、')}`);
  process.exit(0);
}

// 发布 tag 是「已上线」的基线。tag 之后动过的，就是这次要审的增量；
// 哈希状态文件仍然保留，用来标记"这篇我逐字看过了"——两者管的事不一样。
const tag = latestPubTag();
let sinceTag = null;
try { sinceTag = tag ? new Set(changedSince(tag)) : null; } catch { sinceTag = null; }

const todo = args.includes('--all')
  ? rows
  : rows.filter((r) => (sinceTag ? sinceTag.has(r.file) : true) && r.status !== '未变');

if (tag) {
  const n = sinceTag ? sinceTag.size : 0;
  console.log(`\n上次发布：${tag}${isDirty() ? '（笔记有未提交改动）' : ''}`);
  console.log(`自那以后动过 ${n} 篇`);
}
if (!todo.length) {
  console.log('没有需要审阅的文章——全部已审阅且未改动。');
  process.exit(0);
}
console.log(`需要审阅 ${todo.length} 篇（共 ${rows.length} 篇）：\n`);
for (const r of todo) console.log(`  [${r.status}] ${path.join(SRC_DIR, r.file)}`);
