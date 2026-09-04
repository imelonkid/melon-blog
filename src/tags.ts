/**
 * 标签白名单。
 *
 * 站点只允许使用这里列出的标签——新增标签必须显式改这个文件，
 * 让"加标签"成为一个需要动手、会被 code review 看见的决定，
 * 而不是写文章时随手打一个词就多一个分类。
 *
 * 两条硬规则，违反会让构建失败：
 *   1. 标签必须在这个列表里
 *   2. 视觉宽度不超过 8（汉字算 2，西文算 1，即最多 4 个汉字）
 *
 * 宽度上限不只是为了排版——列表页右侧那一栏是 minmax 限宽的，
 * 更重要的是它逼着标签停留在"分类"的粒度上。「动态规划」是标签，
 * 「分布式事务一致性」那是文章标题。
 */
export const TAGS = [
  // 写作
  '随笔', '读书', '杂谈', '音乐',
  // 技术 · 通用
  '技术', '方案', '原理', '博客',
  // 技术 · 语言与平台
  'java', 'JVM', 'mac', 'Centos', 'hexo', 'laf', 'OpenAI', 'AI',
  // 技术 · 数据
  '数据库', 'mysql',
  // 技术 · 算法
  '算法', '数据结构', 'leetcode',
  // 技术 · 其他
  '证书', '扩展点', 'UML', 'github',
] as const;

export type Tag = (typeof TAGS)[number];

/** 视觉宽度：汉字等宽字符算 2，其余算 1 */
export function tagWidth(tag: string): number {
  return [...tag].reduce(
    (n, c) => n + (/[一-鿿぀-ヿ＀-￯]/.test(c) ? 2 : 1),
    0,
  );
}

export const TAG_MAX_WIDTH = 8;

/** 校验单个标签，返回错误信息；通过则返回 null */
export function checkTag(tag: string): string | null {
  const w = tagWidth(tag);
  if (w > TAG_MAX_WIDTH) {
    return `标签「${tag}」视觉宽度 ${w}，超过上限 ${TAG_MAX_WIDTH}（汉字算 2，最多 4 个汉字）`;
  }
  if (!(TAGS as readonly string[]).includes(tag)) {
    return `标签「${tag}」不在白名单里。若确实需要新增，先在 src/tags.ts 的 TAGS 里加上——请先确认现有标签是否已经覆盖，避免标签膨胀。现有标签：${TAGS.join('、')}`;
  }
  return null;
}
