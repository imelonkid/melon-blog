// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import rehypeCodeFigure from './src/lib/rehype-code-figure.mjs';

// https://astro.build/config
export default defineConfig({
  // 部署前改成真实域名：影响 canonical、sitemap 和 RSS 里的绝对链接
  site: 'https://melonkid.cn',
  integrations: [sitemap()],
  // macOS 会在 public/ 下不断生成 .DS_Store，不排除会被复制进 dist 一起部署
  vite: { build: { rollupOptions: { external: [/\.DS_Store$/] } } },
  markdown: {
    processor: unified({ rehypePlugins: [rehypeCodeFigure] }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      wrap: false,
    },
  },
});
