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

const args = process.argv.slice(2);
const state = loadState();

if (args[0] === '--mark') {
  const marked = [];
  for (const name of args.slice(1)) {
    const file = name;
    const full = path.join(SRC_DIR, file);
    if (!fs.existsSync(full)) { console.error(`  找不到 ${file}`); continue; }
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

const todo = args.includes('--all') ? rows : rows.filter((r) => r.status !== '未变');
if (!todo.length) {
  console.log('没有需要审阅的文章——全部已审阅且未改动。');
  process.exit(0);
}
console.log(`需要审阅 ${todo.length} 篇（共 ${rows.length} 篇）：\n`);
for (const r of todo) console.log(`  [${r.status}] ${path.join(SRC_DIR, r.file)}`);
