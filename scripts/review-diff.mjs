/**
 * 把笔记仓库的改动渲染成一页 HTML，供审阅。
 *
 *   node scripts/review-diff.mjs              最近一次 commit
 *   node scripts/review-diff.mjs HEAD~3       从 HEAD~3 到 HEAD
 *   node scripts/review-diff.mjs HEAD~2 HEAD~1
 *
 * 输出到 .review/（已 gitignore，只作发布记录，不进仓库）。
 *
 * 为什么要专门做这个：中文散文的 diff 用命令行看很难受——一段话改几个字，
 * git 会整行标红整行标绿，眼睛得自己去找差在哪。所以这里做了逐字对比，
 * 把真正变动的字符高亮出来。
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { need, ROOT } from './paths.mjs';

const VAULT = need('BLOG_VAULT', 'Obsidian vault 根目录');
const OUT_DIR = path.join(ROOT, '.review');
const SUBPATH = '写点东西';

// core.quotepath=false：否则 git 会把中文路径转义成 "\345\206\231..." 加引号输出
const git = (...args) =>
  execFileSync('git', ['-C', VAULT, '-c', 'core.quotepath=false', ...args],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });

// ── 逐字 diff：找最长公共子序列，两侧各自标出多出来的部分 ──
function charDiff(a, b) {
  const n = a.length, m = b.length;
  // 太长就不做逐字了，避免 O(n*m) 爆掉
  if (n * m > 400_000) return [[{ t: 'del', s: a }], [{ t: 'add', s: b }]];

  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);

  const left = [], right = [];
  const push = (arr, t, s) => {
    const last = arr[arr.length - 1];
    if (last && last.t === t) last.s += s;
    else arr.push({ t, s });
  };
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { push(left, 'same', a[i]); push(right, 'same', b[j]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { push(left, 'del', a[i++]); }
    else { push(right, 'add', b[j++]); }
  }
  while (i < n) push(left, 'del', a[i++]);
  while (j < m) push(right, 'add', b[j++]);
  return [left, right];
}

/** 一个 hunk 里，把相邻的删除块和新增块配对，好做逐字对比 */
function pairLines(dels, adds) {
  const out = [];
  const k = Math.min(dels.length, adds.length);
  for (let i = 0; i < k; i++) {
    // 差太远就别硬配了，当成独立的删除和新增
    const [d, a] = [dels[i], adds[i]];
    const ratio = Math.min(d.length, a.length) / Math.max(d.length, a.length, 1);
    out.push(ratio > 0.4 ? { kind: 'pair', del: d, add: a } : { kind: 'del', s: d });
    if (ratio <= 0.4) out.push({ kind: 'add', s: a });
  }
  for (let i = k; i < dels.length; i++) out.push({ kind: 'del', s: dels[i] });
  for (let i = k; i < adds.length; i++) out.push({ kind: 'add', s: adds[i] });
  return out;
}

function parseDiff(raw) {
  const files = [];
  let cur = null, dels = [], adds = [];

  const flush = () => {
    if (!cur) return;
    if (dels.length || adds.length) cur.rows.push(...pairLines(dels, adds));
    dels = []; adds = [];
  };

  for (const line of raw.split('\n')) {
    if (line.startsWith('diff --git')) {
      flush();
      cur = { name: '', rows: [], add: 0, del: 0 };
      files.push(cur);
    } else if (line.startsWith('+++ ')) {
      // 行尾可能跟着 tab + 时间戳，要去掉
      const m = line.match(/^\+\+\+ "?b\/(.*?)"?\s*$/);
      if (cur && m) cur.name = m[1].replace(/\s+$/, '');
    } else if (line.startsWith('@@')) {
      flush();
      const m = line.match(/@@ [^@]* @@ ?(.*)/);
      cur?.rows.push({ kind: 'hunk', s: m?.[1] || '' });
    } else if (line.startsWith('---') || line.startsWith('index ')
               || line.startsWith('new file') || line.startsWith('deleted file')
               || line.startsWith('similarity ') || line.startsWith('rename ')) {
      continue;
    } else if (cur && line.startsWith('-')) { dels.push(line.slice(1)); cur.del++; }
    else if (cur && line.startsWith('+')) { adds.push(line.slice(1)); cur.add++; }
    else if (cur && line.startsWith(' ')) { flush(); cur.rows.push({ kind: 'ctx', s: line.slice(1) }); }
  }
  flush();
  // 文件名从 git 的八进制转义还原
  for (const f of files) f.short = f.name.replace(/^写点东西\//, '');
  return files.filter((f) => f.rows.length);
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const seg = (parts) => parts.map((p) =>
  p.t === 'same' ? esc(p.s) : `<mark class="${p.t}">${esc(p.s)}</mark>`).join('');

function renderRows(rows) {
  return rows.map((r) => {
    if (r.kind === 'hunk') return `<div class="hunk">${esc(r.s) || '···'}</div>`;
    if (r.kind === 'ctx') return `<div class="row ctx">${esc(r.s) || '&nbsp;'}</div>`;
    if (r.kind === 'del') return `<div class="row del"><span class="sig">−</span>${esc(r.s) || '&nbsp;'}</div>`;
    if (r.kind === 'add') return `<div class="row add"><span class="sig">+</span>${esc(r.s) || '&nbsp;'}</div>`;
    const [l, rr] = charDiff(r.del, r.add);
    return `<div class="row del"><span class="sig">−</span>${seg(l)}</div>`
         + `<div class="row add"><span class="sig">+</span>${seg(rr)}</div>`;
  }).join('');
}

function main() {
  const [a, b] = process.argv.slice(2);
  const from = a ?? 'HEAD~1';
  const to = b ?? 'HEAD';

  const raw = git('diff', '--no-color', '-M', from, to, '--', SUBPATH);
  const files = parseDiff(raw);
  const log = git('log', '--format=%h|%ad|%s', '--date=format:%Y-%m-%d %H:%M',
    `${from}..${to}`, '--', SUBPATH).trim().split('\n').filter(Boolean)
    .map((l) => { const [h, d, ...s] = l.split('|'); return { h, d, s: s.join('|') }; });

  const totalAdd = files.reduce((n, f) => n + f.add, 0);
  const totalDel = files.reduce((n, f) => n + f.del, 0);

  const html = `<!doctype html>
<html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>审阅改动 ${from}..${to}</title>
<style>
:root{
  --bg:#fbfaf8; --ink:#1a1a1a; --sub:#6f6d67; --line:#e8e6e1; --card:#fff;
  --add-bg:#eaf6ed; --add-line:#bcdfc7; --add-mark:#9fe0b4;
  --del-bg:#fdeeec; --del-line:#f2c9c3; --del-mark:#f7b8b0;
  --hunk:#f1f4f8; --hunk-ink:#40556e;
}
@media (prefers-color-scheme:dark){:root{
  --bg:#161615; --ink:#e6e4df; --sub:#95938c; --line:#31312e; --card:#1c1c1a;
  --add-bg:#152218; --add-line:#2a4531; --add-mark:#2f6b45;
  --del-bg:#251818; --del-line:#4a2b28; --del-mark:#7e3730;
  --hunk:#1b2029; --hunk-ink:#a8c0da;
}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);
  font:15px/1.65 -apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB',sans-serif;
  padding:2.5rem 1.25rem 4rem}
.wrap{max-width:900px;margin:0 auto}
h1{font:600 1.45rem/1.3 Georgia,'Songti SC',serif;margin:0 0 .5rem}
.meta{color:var(--sub);font-size:.85rem;display:flex;flex-wrap:wrap;gap:.3rem 1.1rem}
.tally{margin:1rem 0 0;font-size:.85rem}
.tally .a{color:#2f6b45;font-weight:600}
.tally .d{color:#b3261e;font-weight:600}
@media (prefers-color-scheme:dark){.tally .a{color:#89c9a3}.tally .d{color:#ff8a80}}
.commits{margin:1.25rem 0 0;padding:.85rem 1rem;background:var(--card);
  border:1px solid var(--line);border-radius:8px;font-size:.86rem}
.commits div{display:flex;gap:.7rem;padding:.15rem 0}
.commits code{color:var(--sub);font:12px ui-monospace,Menlo,monospace}
.commits .when{color:var(--sub);white-space:nowrap}
.file{margin-top:2rem;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:var(--card)}
.file > header{padding:.7rem 1rem;border-bottom:1px solid var(--line);
  display:flex;justify-content:space-between;gap:1rem;align-items:baseline}
.file h2{margin:0;font-size:.95rem;font-weight:600;word-break:break-all}
.file .n{font-size:.8rem;white-space:nowrap}
.body{font:13px/1.75 ui-monospace,SFMono-Regular,Menlo,'PingFang SC',monospace;
  overflow-x:auto}
.row{padding:.1rem 1rem .1rem 2rem;white-space:pre-wrap;word-break:break-word;position:relative}
.row .sig{position:absolute;left:.85rem;opacity:.55}
.ctx{color:var(--sub)}
.add{background:var(--add-bg);box-shadow:inset 2px 0 0 var(--add-line)}
.del{background:var(--del-bg);box-shadow:inset 2px 0 0 var(--del-line)}
mark{background:var(--add-mark);color:inherit;border-radius:2px;padding:0 1px}
mark.del{background:var(--del-mark)}
.hunk{padding:.35rem 1rem;background:var(--hunk);color:var(--hunk-ink);
  font-size:12px;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.file:first-of-type .hunk:first-child{border-top:0}
footer{margin-top:2.5rem;padding-top:1.25rem;border-top:1px solid var(--line);
  color:var(--sub);font-size:.8rem}
code.k{font:12px ui-monospace,Menlo,monospace;background:var(--line);padding:.1rem .35rem;border-radius:3px}
.empty{margin-top:2rem;padding:1.5rem;text-align:center;color:var(--sub);
  border:1px dashed var(--line);border-radius:8px}
</style></head><body><div class="wrap">
<h1>审阅改动</h1>
<div class="meta">
  <span>${esc(from)} … ${esc(to)}</span>
  <span>${files.length} 个文件</span>
  <span>${new Date().toLocaleString('sv').slice(0, 16)}</span>
</div>
<div class="tally"><span class="a">+${totalAdd}</span> / <span class="d">−${totalDel}</span> 行</div>
${log.length ? `<div class="commits">${log.map((c) =>
  `<div><code>${esc(c.h)}</code><span>${esc(c.s)}</span><span class="when">${esc(c.d)}</span></div>`).join('')}</div>` : ''}
${files.length ? files.map((f) => `
<section class="file">
  <header>
    <h2>${esc(f.short)}</h2>
    <span class="n"><span class="a" style="color:inherit">+${f.add}</span> / −${f.del}</span>
  </header>
  <div class="body">${renderRows(f.rows)}</div>
</section>`).join('') : '<div class="empty">这个范围内没有改动</div>'}
<footer>
  由 <code class="k">pnpm run review:diff</code> 生成。逐字高亮的是真正变动的部分。<br>
  只存在本地 <code class="k">.review/</code>，不进仓库。
</footer>
</div></body></html>`;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 13);
  const file = path.join(OUT_DIR, `diff-${stamp}.html`);
  fs.writeFileSync(file, html);
  fs.writeFileSync(path.join(OUT_DIR, 'latest.html'), html);

  console.log(`\n  ${files.length} 个文件 · +${totalAdd} / −${totalDel} 行`);
  files.forEach((f) => console.log(`    ${f.short}  +${f.add} / −${f.del}`));
  console.log(`\n  ${file}`);
}

main();
