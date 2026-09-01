// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import rehypeCodeFigure from './src/lib/rehype-code-figure.mjs';

// https://astro.build/config
export default defineConfig({
  // 部署前改成真实域名：影响 canonical、sitemap 和 RSS 里的绝对链接
  site: 'https://blog.melonkid.cn',
  integrations: [sitemap()],
  markdown: {
    processor: unified({ rehypePlugins: [rehypeCodeFigure] }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      wrap: false,
    },
  },
});
