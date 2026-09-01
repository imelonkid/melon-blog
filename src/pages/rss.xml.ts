import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { allPosts } from '../lib/posts';
import { SITE } from '../consts';

export async function GET(context: APIContext) {
  const posts = await allPosts();
  return rss({
    title: SITE.title,
    description: SITE.intro,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.excerpt,
      categories: [post.data.tag],
      link: `/posts/${post.id}`,
    })),
  });
}
