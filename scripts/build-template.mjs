/**
 * 从 src/tags.ts 生成 Obsidian 的「博客文章」模板。
 *
 * 手抄白名单必然会漂——写这个脚本的当天我就凭记忆抄错过一次。
 * 标签有增减就重跑：pnpm run template
 */
import fs from 'node:fs';
import path from 'node:path';
import { need } from './paths.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'src/tags.ts'), 'utf8');

const block = src.match(/export const TAGS = \[([\s\S]*?)\] as const;/);
if (!block) { console.error('没能从 src/tags.ts 里解析出 TAGS'); process.exit(1); }
const tags = [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
const max = Number((src.match(/TAG_MAX_WIDTH = (\d+)/) || [])[1] ?? 8);

// 每行 8 个，读起来不至于糊成一片
const lines = [];
for (let i = 0; i < tags.length; i += 8) lines.push('          ' + tags.slice(i, i + 8).join(' '));

const out = `---
title: 
date: {{date:YYYY-MM-DD}}
updated: 
tag: 随笔
publish: false
slug: 
excerpt: 
---

%%
date      发表日，发布之后就别再动了。它决定首页排序和 RSS 推送，
          改了会让老文章跳回顶部、订阅者收到重复推送。
updated   实质修改日。留空即可 —— 审阅时如果发现正文改过会自动填。
tag       只能从下面这些里选。新增要过审：标签膨胀是慢性病，
          每次都觉得"就多这一个"，一年后就是七十个。
${lines.join('\n')}
          视觉宽度上限 ${max}（汉字算 2，即最多 ${Math.floor(max / 2)} 个汉字），超了构建会失败。
publish   改成 true 才会同步到博客。
slug      网址用，留空则用文件名。技术文建议给英文 slug。
excerpt   留空则自动取正文首段。

这段注释被 %% 包着，Obsidian 预览和博客上都不会显示。
%%

`;

const dest = path.join(need('BLOG_VAULT'), 'Templates/博客文章.md');
fs.writeFileSync(dest, out);
console.log(`  ✓ 模板已生成，${tags.length} 个标签`);
