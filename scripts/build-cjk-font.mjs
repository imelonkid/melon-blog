/**
 * 生成自托管的思源宋体（Noto Serif SC）分片。
 *
 * ⚠️ 当前站点未启用——正文用系统字体，见 global.css 里 --serif 的说明。
 * 保留此脚本是因为重新生成需要两个不显然的前提：Google Fonts 只对完整的
 * 现代浏览器 UA 返回分片版 woff2，以及静态实例比可变字体小一半。
 * 哪天要换成统一字形，跑一遍这个脚本再在 Base.astro 里 link 上即可。
 *
 *   node scripts/build-cjk-font.mjs
 *
 * 中文字体整体是 MB 级，一次性下发不现实。这里按 unicode-range 切成上百个
 * 小片，浏览器只会下载当前页面用到的那几片——和 Google Fonts 对 CJK 的做法
 * 一致，区别只是文件放在自己服务器上，国内访问不受制于人。
 *
 * 切分区间直接复用 Google 调好的（按字频聚类，不是简单按码位均分），
 * 只在生成时抓一次，产物不依赖任何外部服务。
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const SRC = '/tmp/notoserifsc.ttf';
const OUT_DIR = 'public/fonts/noto-serif-sc';
const CSS_OUT = 'public/fonts/noto-serif-sc.css';
const FAMILY = 'Noto Serif SC';

/**
 * 只生成 400 和 700 两档静态实例，不用可变字体。
 * 实测同一区间：可变(200-900) 227KB、可变(400-700) 229KB、静态(400) 117KB
 * ——裁剪字重范围几乎不省，因为变体数据是逐字形的差值；换成静态直接减半。
 * 站点原本还用了 600，已在 CSS 里并到 700，视觉差异很小但省掉一整套分片。
 */
const WEIGHTS = [400, 700];

const css = await fetch(
  'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@200..900&display=swap',
  { headers: { 'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' } },
).then((r) => r.text());

const ranges = [...css.matchAll(/unicode-range:\s*([^;}]+)/g)].map((m) => m[1].trim());
if (!ranges.length) throw new Error('未能解析出 unicode-range');

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const faces = [];
let total = 0;
for (const weight of WEIGHTS) {
  // 先把可变字体固化成该字重的静态实例，再切片
  const instance = `/tmp/noto-${weight}.ttf`;
  if (!fs.existsSync(instance)) {
    execFileSync('python3', [
      '-m', 'fontTools.varLib.instancer', SRC, `wght=${weight}`, '-o', instance,
    ]);
  }
  ranges.forEach((range, i) => {
    const file = path.join(OUT_DIR, `${weight}-${i}.woff2`);
    execFileSync('pyftsubset', [
      instance,
      `--unicodes=${range.replace(/U\+/g, '').replace(/\s/g, '')}`,
      '--flavor=woff2',
      '--layout-features=*',
      `--output-file=${file}`,
    ]);
    const size = fs.statSync(file).size;
    if (size < 500) { fs.unlinkSync(file); return; } // 该区间无字形，跳过
    total += size;
    faces.push(`@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: ${weight};
  font-display: swap;
  src: url('/fonts/noto-serif-sc/${weight}-${i}.woff2') format('woff2');
  unicode-range: ${range};
}`);
  });
}

fs.writeFileSync(
  CSS_OUT,
  `/* 思源宋体 Noto Serif SC · SIL Open Font License 1.1
   由 scripts/build-cjk-font.mjs 生成，勿手改。
   ${faces.length} 个分片（400 与 700 两档），合计 ${(total / 1024 / 1024).toFixed(1)} MB；
   浏览器按 unicode-range 只下载页面用到的那几片。 */\n\n` + faces.join('\n\n') + '\n',
);

console.log(`  ${faces.length} 个分片，合计 ${(total / 1024 / 1024).toFixed(1)} MB`);
console.log(`  单片平均 ${(total / faces.length / 1024).toFixed(0)} KB`);
