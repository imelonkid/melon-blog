import fs from 'node:fs';
import path from 'node:path';
import { visit } from 'unist-util-visit';
import { imageSize } from 'image-size';

const PUBLIC_DIR = path.resolve(import.meta.dirname, '../../public');
const cache = new Map();

/**
 * 给正文里的本地图片补上 width / height。
 *
 * 不写尺寸时浏览器不知道图片多高，只能先按 0 排版，等图片下载完再撑开。
 * 后果是刷新时滚动位置对不上——浏览器在布局定型前就恢复了滚动，图片一到
 * 高度突变，看起来就是"闪一下再跳"。实测一篇带图的文章，加载过程中文档高度
 * 从 867 → 7417 → 8397 一路在变。
 *
 * 补上宽高后浏览器能提前算出 aspect-ratio 预留空间，布局一次到位。
 * 这同时也是 CLS 的标准修法，对所有读者都有意义，不只是修这个闪动。
 */
/** 查一张本地图的尺寸，查不到返回 null */
function lookup(src) {
  if (cache.has(src)) return cache.get(src);
  let dim = null;
  try {
    const file = path.join(PUBLIC_DIR, decodeURIComponent(src));
    if (fs.existsSync(file)) dim = imageSize(fs.readFileSync(file));
  } catch {
    dim = null;
  }
  cache.set(src, dim);
  return dim;
}

export default function rehypeImageSize() {
  return (tree) => {
    // 老文章在 markdown 里直接写了 <img> 标签，这类内容在 rehype 阶段
    // 还是未解析的 raw 节点，visit('element') 扫不到，得单独处理
    visit(tree, 'raw', (node) => {
      if (typeof node.value !== 'string' || !node.value.includes('<img')) return;
      node.value = node.value.replace(/<img\b[^>]*>/g, (tag) => {
        const src = tag.match(/\bsrc="([^"]+)"/)?.[1];
        if (!src || !src.startsWith('/')) return tag;
        const dim = lookup(src);
        if (!dim?.width || !dim?.height) return tag;
        // 去掉百分比宽高，换成真实像素
        let out = tag.replace(/\s(width|height)="[^"]*%"/g, '');
        if (/\swidth="\d/.test(out) && /\sheight="\d/.test(out)) return out;
        out = out.replace(/\s*\/?>$/, ` width="${dim.width}" height="${dim.height}">`);
        return out;
      });
    });

    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img') return;
      const src = node.properties?.src;
      if (typeof src !== 'string' || !src.startsWith('/')) return; // 外链跳过
      // 老文章里写的是 width="80%" 这类百分比，既给不了宽高比，
      // 又会限制显示宽度——一律换成真实像素
      const pct = (v) => typeof v === 'string' && v.trim().endsWith('%');
      if (pct(node.properties.width)) delete node.properties.width;
      if (pct(node.properties.height)) delete node.properties.height;
      if (node.properties.width && node.properties.height) return; // 作者给了具体像素就不动

      const dim = lookup(src);
      if (dim?.width && dim?.height) {
        node.properties.width = dim.width;
        node.properties.height = dim.height;
      }
    });
  };
}
