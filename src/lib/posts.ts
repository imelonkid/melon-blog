import { getCollection, type CollectionEntry } from 'astro:content';

type Entry = CollectionEntry<'posts'>;

/** 列表和文章页真正用到的形状：缺失字段已由正文推导补齐 */
export interface Post {
  id: Entry['id'];
  body: string;
  data: Entry['data'];
  title: string;
  date: Date;
  tag: string;
  mins: number;
  excerpt: string;
  entry: Entry;
}

const toList = (v: string | string[] | undefined): string[] =>
  Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[\s,]+/).filter(Boolean) : [];

/** 去掉代码块、HTML、图片、链接语法，只留下可读正文 */
function plainText(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/&nbsp;/g, ' ');
}

/** 中文按 350 字/分钟，英文按 200 词/分钟估算 */
function readingMinutes(body: string): number {
  const text = plainText(body);
  const cjk = (text.match(/[一-鿿　-〿]/g) ?? []).length;
  const words = (text.match(/[A-Za-z0-9][A-Za-z0-9'-]*/g) ?? []).length;
  return Math.max(1, Math.round(cjk / 350 + words / 200));
}

/** 取正文第一段可读文字作为摘要 */
function deriveExcerpt(body: string, limit = 80): string {
  for (const block of plainText(body).split(/\n\s*\n/)) {
    const line = block
      .replace(/^\s*[#>*\-+]+\s*/gm, '')
      .replace(/^\s*\|.*$/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (line.length < 8) continue;
    return line.length > limit ? line.slice(0, limit) + '…' : line;
  }
  return '';
}

function normalize(entry: Entry): Post {
  const body = entry.body ?? '';
  const d = entry.data;
  const tag = d.tag ?? toList(d.tags)[0] ?? toList(d.categories)[0] ?? '未分类';
  return {
    id: entry.id,
    body,
    data: d,
    title: d.title,
    date: d.date,
    tag,
    mins: d.mins ?? readingMinutes(body),
    excerpt: d.excerpt ?? deriveExcerpt(body),
    entry,
  };
}

/** 已发布文章，按日期倒序。草稿只在 dev 下可见。 */
export async function allPosts(): Promise<Post[]> {
  const entries = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return entries.map(normalize).sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

export const formatDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
