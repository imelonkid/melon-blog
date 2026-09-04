import { visit } from 'unist-util-visit';
import { createMermaidRenderer } from 'mermaid-isomorphic';

/**
 * 构建期把 ```mermaid 代码块渲染成内联 SVG。
 *
 * 为什么写在 remark 阶段而不用现成的 rehype-mermaid：
 * rehype 插件在 Astro 里跑在语法高亮之后，Shiki 已经把
 * <code class="language-mermaid"> 的类名剥掉了，rehype-mermaid 认不出来。
 * 官方的解法是 markdown.syntaxHighlight.excludeLangs，但那个选项和本项目
 * 用的自定义 markdown.processor 冲突——两者同时配置会让正文静默渲染为空。
 * remark 阶段完全早于 rehype 和 Shiki，从根上避开这个问题。
 *
 * 渲染依赖 Playwright 的无头 Chromium（mermaid 需要真实 DOM 做文本测量），
 * 只在构建期跑一次，读者侧是纯 SVG，不加载任何 JS。
 */
export default function remarkMermaid() {
  const render = createMermaidRenderer();

  return async (tree, file) => {
    const nodes = [];
    visit(tree, 'code', (node) => {
      if (node.lang === 'mermaid') nodes.push(node);
    });
    if (!nodes.length) return;

    const results = await render(
      nodes.map((n) => n.value),
      {
        // 用 neutral 主题保证布局与派生色计算正常（mermaid 不接受 CSS 变量，
        // 会报 Unsupported color format）。配色改由站点 CSS 覆盖，
        // 见 global.css 里的 .prose figure.mermaid 一节——这样图能跟着明暗主题走。
        mermaidConfig: { theme: 'neutral', fontFamily: 'inherit' },
      },
    );

    results.forEach((res, i) => {
      const node = nodes[i];
      if (res.status !== 'fulfilled') {
        // 图画错了就让构建失败，而不是悄悄发一个空白出去
        throw new Error(
          `[${file?.path ?? 'mermaid'}] 第 ${i + 1} 张 mermaid 图渲染失败：${res.reason}`,
        );
      }
      const { svg, description } = res.value;
      node.type = 'html';
      node.value = `<figure class="diagram mermaid">${
        description ? svg.replace('<svg ', `<svg role="img" aria-label="${description}" `) : svg
      }</figure>`;
    });
  };
}
