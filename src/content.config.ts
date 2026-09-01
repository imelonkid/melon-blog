import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tag: z.string(),
    mins: z.number(),
    excerpt: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
