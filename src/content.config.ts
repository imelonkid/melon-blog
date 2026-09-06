import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';

/** tags/categories 在不同博客引擎里可能是数组，也可能是空格分隔的字符串 */
const listish = z.union([z.string(), z.array(z.string())]).optional();

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    // Jekyll 的 "2017-02-16 17:29:57 +0800" 和 Hexo 的 "2021-09-06 21:12:12"
    // 都会被 YAML 当成字符串，这里统一强制转成日期
    date: z.coerce.date(),
    // 发表日（date）发布后不再动 —— 它决定首页排序和 RSS 的 pubDate，
    // 改它会让老文章跳回首页顶部、订阅者收到重复推送。
    // 实质修改记在 updated，审阅时自动写入。
    // 空的 updated: 会被 YAML 解析成 null，z.coerce.date() 会把它转成 1970。
    // 先归一成 undefined，别让空值变成一个看起来合法的日期。
    updated: z.preprocess(
      (v) => (v === '' || v === null ? undefined : v),
      z.coerce.date().optional(),
    ),
    // 以下字段历史文章都没有，缺失时由 lib/posts.ts 从正文推导
    tag: z.string().optional(),
    tags: listish,
    categories: listish,
    mins: z.number().optional(),
    excerpt: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
