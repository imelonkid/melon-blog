// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkMermaid from './src/lib/remark-mermaid.mjs';
import rehypeCodeFigure from './src/lib/rehype-code-figure.mjs';
import rehypeImageSize from './src/lib/rehype-image-size.mjs';

// https://astro.build/config
export default defineConfig({
  // 部署前改成真实域名：影响 canonical、sitemap 和 RSS 里的绝对链接
  site: 'https://melonkid.cn',
  integrations: [sitemap()],
  markdown: {
    processor: unified({
      remarkPlugins: [
        // 必须在这里而不是 rehypePlugins：rehype 阶段 Shiki 已经处理过
        // 代码块，语言标识丢失，mermaid 就认不出来了
        remarkMermaid,
        [
          remarkMath,
          {
            // 只认 $$…$$ 块级公式，不认 $…$ 行内。
            // 站里有 5 篇文章写着 $JAVA_HOME/bin:$PATH 这类 shell 变量，
            // 开了行内公式会把它们当成数学解析，正文直接渲染坏。
            singleDollarTextMath: false,
          },
        ],
      ],
      rehypePlugins: [
        // 构建期把公式渲染成 HTML+CSS。样式与字体自托管在 /katex/ 下
        // （只保留 woff2，296KB），且只有含公式的页面才引入那份 CSS，
        // 见 posts/[id].astro 里的 hasMath 判断
        rehypeKatex,
        rehypeCodeFigure,
        // 给本地图片补宽高，避免图片到达前后布局高度突变
        rehypeImageSize,
      ],
    }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      wrap: false,
    },
    // mermaid 交给 rehype-mermaid 渲染，不能让 Shiki 先高亮——它会剥掉
    // code 上的 language-mermaid 类，后续插件就认不出来了。
    // 注意这个选项属于 syntaxHighlight，不在 shikiConfig 下（默认值本身
    // 就是 { type: 'shiki', excludeLangs: ['math'] }，覆盖时要把 math 带上）
  },
});
