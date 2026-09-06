/**
 * 读自建埋点的日志，出一页 HTML 报告。
 *
 *   pnpm run stats            最近 14 天
 *   pnpm run stats 30         最近 30 天
 *
 * 数据来自服务器上的 beacon.log，由页面里那段内联脚本打点。
 * 那份日志刻意不含 IP 和 UA——访客只有一个 localStorage 里的随机 id。
 *
 * 爬虫不执行 JS，所以这里不需要任何 bot 过滤：能进来的都是真人。
 * 这是它比 nginx access.log 强的地方，那份日志里 15% 是扫描器。
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { need, ROOT } from './paths.mjs';

const SSH = need('BLOG_SSH', '服务器 SSH 别名');
const SITE = need('BLOG_SITE', '站点地址');
const OUT_DIR = path.join(ROOT, '.review');
const DAYS = Number(process.argv[2] || 14);

// 文章标题：从本地内容目录读，报告里显示标题比 slug 好认
function titleMap() {
  const dir = path.join(ROOT, 'src/content/posts');
  const map = {};
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.md')) continue;
    const t = fs.readFileSync(path.join(dir, f), 'utf8').match(/^title:\s*(.+)$/m);
    if (t) map['/posts/' + f.replace(/\.md$/, '') + '/'] = t[1].replace(/^["']|["']$/g, '');
  }
  return map;
}

function fetchLog() {
  // 当前日志 + 轮转归档（.gz 和未压缩的都要）
  const cmd = 'L=/opt/1panel/www/sites/melonkid.cn/log; '
    + 'cat "$L/beacon.log" 2>/dev/null; '
    + 'for f in "$L"/beacon.log-*; do '
    + '  [ -e "$f" ] || continue; '
    + '  case "$f" in *.gz) zcat "$f";; *) cat "$f";; esac; '
    + 'done 2>/dev/null';
  try {
    return execFileSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15', SSH, cmd],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    // 连不上服务器，绝不能表现得像"没有访问数据"——那是两件完全不同的事
    console.error(`\n  连不上服务器（${SSH}），拿不到埋点日志。`);
    console.error('  这不等于"没人访问"，是这次采集失败了。');
    console.error(`  ${(e.stderr || e.message || '').toString().trim().split('\n')[0]}\n`);
    process.exit(1);
  }
}

function parse(raw) {
  const rows = [];
  const cutoff = new Date(Date.now() - DAYS * 864e5);
  for (const line of raw.split('\n')) {
    const [ts, e, v, p, r, w, d] = line.split('|');
    if (!ts || !e) continue;
    const when = new Date(ts);
    if (isNaN(when) || when < cutoff) continue;
    if (v === 'testtest') continue;               // 联调时打的测试点
    let pathname = '/';
    try { pathname = decodeURIComponent(p || '/'); } catch { pathname = p || '/'; }
    rows.push({
      day: ts.slice(0, 10),
      e, v: v || 'anon', p: pathname,
      r: r || '',
      w: Number(w) || 0,
      d: Number(d) || 0,
    });
  }
  return rows;
}


/** 交互式终端里跑完直接打开；被脚本或定时任务调用时不弹窗 */
function reveal(file) {
  console.log(`\n  ${file}`);
  if (!process.stdout.isTTY) return;
  try { execFileSync('open', [file]); } catch { /* 非 macOS 就算了 */ }
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** 极简柱状图，纯 div，不引任何库 */
function bars(data, fmt = (n) => n) {
  const max = Math.max(...data.map((d) => d.n), 1);
  return `<div class="bars">${data.map((d) => `
    <div class="bar" title="${esc(d.k)}：${d.n}">
      <div class="col"><span style="height:${Math.round((d.n / max) * 100)}%"></span></div>
      <div class="bk">${esc(d.k)}</div>
      <div class="bn">${fmt(d.n)}</div>
    </div>`).join('')}</div>`;
}

function main() {
  const rows = parse(fetchLog());
  const titles = titleMap();

  if (!rows.length) {
    console.log(`\n  最近 ${DAYS} 天没有埋点数据。`);
    console.log('  刚上线的话，等有人访问之后再看；也确认一下页面上的埋点脚本发出去了。\n');
    return;
  }

  const views = rows.filter((r) => r.e === 'view');
  const reads = rows.filter((r) => r.e === 'read');

  // ── 每日 PV / UV ──
  const byDay = {};
  for (const r of views) (byDay[r.day] ||= { pv: 0, v: new Set() }).pv++, byDay[r.day].v.add(r.v);
  const days = Object.keys(byDay).sort();

  // ── 文章排行：PV、独立访客、完读率、中位停留 ──
  const byPath = {};
  for (const r of views) {
    const b = (byPath[r.p] ||= { pv: 0, uv: new Set(), read: 0, dwell: [] });
    b.pv++; b.uv.add(r.v);
  }
  for (const r of reads) {
    const b = byPath[r.p];
    if (!b) continue;
    b.read++;
    if (r.d) b.dwell.push(r.d);
  }
  const median = (a) => a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : 0;
  const ranked = Object.entries(byPath)
    .map(([p, b]) => ({
      p, pv: b.pv, uv: b.uv.size,
      rate: b.pv ? Math.round((b.read / b.pv) * 100) : 0,
      dwell: median(b.dwell),
      title: titles[p] || p,
    }))
    .sort((a, b) => b.pv - a.pv);

  // ── 来源 ──
  const refs = {};
  for (const r of views) if (r.r) refs[r.r] = (refs[r.r] || 0) + 1;
  const refList = Object.entries(refs).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const direct = views.filter((r) => !r.r).length;

  // ── 设备宽度 ──
  const buckets = { '手机 <560': 0, '平板 560–900': 0, '桌面 >900': 0 };
  for (const r of views) {
    if (!r.w) continue;
    if (r.w < 560) buckets['手机 <560']++;
    else if (r.w <= 900) buckets['平板 560–900']++;
    else buckets['桌面 >900']++;
  }

  const uvAll = new Set(views.map((r) => r.v)).size;
  const returning = Object.values(
    views.reduce((m, r) => ((m[r.v] ||= new Set()).add(r.day), m), {}),
  ).filter((s) => s.size > 1).length;

  const html = `<!doctype html>
<html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>访问统计 · 最近 ${DAYS} 天</title>
<style>
:root{--bg:#fbfaf8;--ink:#1a1a1a;--sub:#6f6d67;--line:#e8e6e1;--card:#fff;--accent:#40556e;--fill:#c9d4e2}
@media (prefers-color-scheme:dark){:root{--bg:#161615;--ink:#e6e4df;--sub:#95938c;--line:#31312e;--card:#1c1c1a;--accent:#a8c0da;--fill:#39485c}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);
  font:15px/1.65 -apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB',sans-serif;padding:2.5rem 1.25rem 4rem}
.wrap{max-width:860px;margin:0 auto}
h1{font:600 1.45rem/1.3 Georgia,'Songti SC',serif;margin:0 0 .4rem}
h2{font:600 1.05rem/1.3 Georgia,'Songti SC',serif;margin:2.25rem 0 .9rem}
.meta{color:var(--sub);font-size:.85rem}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:.6rem;margin-top:1.25rem}
.kpi{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:.85rem 1rem}
.kpi b{display:block;font:600 1.5rem/1.2 Georgia,serif}
.kpi span{color:var(--sub);font-size:.78rem}
.bars{display:flex;gap:.35rem;align-items:flex-end;overflow-x:auto;padding:.5rem 0}
.bar{flex:1;min-width:34px;text-align:center}
.col{height:110px;display:flex;align-items:flex-end}
.col span{display:block;width:100%;background:var(--fill);border-radius:3px 3px 0 0;min-height:2px}
.bk{font-size:.68rem;color:var(--sub);margin-top:.35rem;white-space:nowrap}
.bn{font-size:.72rem;font-weight:600}
table{width:100%;border-collapse:collapse;font-size:.88rem}
th,td{text-align:left;padding:.5rem .6rem;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--sub);font-weight:500;font-size:.78rem}
td.n,th.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.t{font-weight:500}.t small{display:block;color:var(--sub);font-weight:400;font-size:.75rem;word-break:break-all}
.rate{display:inline-block;min-width:2.6rem}
.empty{color:var(--sub);font-size:.88rem;padding:.6rem 0}
footer{margin-top:2.5rem;padding-top:1.25rem;border-top:1px solid var(--line);color:var(--sub);font-size:.8rem}
code{font:12px ui-monospace,Menlo,monospace;background:var(--line);padding:.1rem .35rem;border-radius:3px}
</style></head><body><div class="wrap">
<h1>访问统计</h1>
<div class="meta">${esc(SITE)} · 最近 ${DAYS} 天 · ${esc(days[0] || '')} → ${esc(days[days.length - 1] || '')}</div>

<div class="kpis">
  <div class="kpi"><b>${views.length}</b><span>页面浏览</span></div>
  <div class="kpi"><b>${uvAll}</b><span>独立访客</span></div>
  <div class="kpi"><b>${returning}</b><span>回访（跨天）</span></div>
  <div class="kpi"><b>${views.length ? Math.round((reads.length / views.length) * 100) : 0}%</b><span>整体完读率</span></div>
</div>

<h2>每日浏览</h2>
${bars(days.map((d) => ({ k: d.slice(5), n: byDay[d].pv })))}
<h2>每日独立访客</h2>
${bars(days.map((d) => ({ k: d.slice(5), n: byDay[d].v.size })))}

<h2>文章排行</h2>
<table>
  <tr><th>页面</th><th class="n">浏览</th><th class="n">访客</th><th class="n">完读率</th><th class="n">停留中位</th></tr>
  ${ranked.slice(0, 25).map((r) => `<tr>
    <td class="t">${esc(r.title)}<small>${esc(r.p)}</small></td>
    <td class="n">${r.pv}</td><td class="n">${r.uv}</td>
    <td class="n"><span class="rate">${r.rate}%</span></td>
    <td class="n">${r.dwell ? r.dwell + 's' : '—'}</td>
  </tr>`).join('')}
</table>

<h2>来源</h2>
${refList.length ? `<table>
  <tr><th>域名</th><th class="n">次数</th></tr>
  ${refList.map(([k, n]) => `<tr><td>${esc(k)}</td><td class="n">${n}</td></tr>`).join('')}
  <tr><td>直接访问 / 无来源</td><td class="n">${direct}</td></tr>
</table>` : `<div class="empty">全部是直接访问（${direct} 次）。没有外部来源不代表没人看，
只说明还没被搜索引擎或社区链接过。</div>`}

<h2>屏幕宽度</h2>
${bars(Object.entries(buckets).map(([k, n]) => ({ k, n })))}

<footer>
  由 <code>pnpm run stats</code> 生成，数据来自自建埋点。<br>
  服务端日志里没有 IP，也没有 User-Agent；访客只有页面 localStorage 里的一个随机 id。<br>
  爬虫不执行 JS，所以这份数据不含扫描器——不需要 bot 过滤。<br>
  完读 = 滚过 70% 或停留满 30 秒。报告只存本地 <code>.review/</code>。
</footer>
</div></body></html>`;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `stats-${new Date().toLocaleDateString('sv')}.html`);
  fs.writeFileSync(file, html);
  fs.writeFileSync(path.join(OUT_DIR, 'stats.html'), html);

  console.log(`\n  最近 ${DAYS} 天：${views.length} 次浏览 · ${uvAll} 位访客 · 完读率 ${views.length ? Math.round((reads.length / views.length) * 100) : 0}%`);
  ranked.slice(0, 6).forEach((r) => console.log(`    ${String(r.pv).padStart(4)}  ${r.rate}%  ${r.title.slice(0, 34)}`));
  reveal(path.join(OUT_DIR, 'stats.html'));
}

main();
