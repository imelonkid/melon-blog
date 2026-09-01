import { visit } from 'unist-util-visit';

/**
 * 还原原型里的代码块外观：外面包一层带语言标签栏的边框盒子。
 * <pre> → <figure class="code"><div class="code-lang">PYTHON</div><pre>…</pre></figure>
 */
export default function rehypeCodeFigure() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index === undefined) return;
      if (parent.type === 'element' && parent.tagName === 'figure') return;

      // Shiki 处理后语言落在 <pre data-language>，未高亮时才在 <code class="language-*">
      const code = node.children?.find((c) => c.type === 'element' && c.tagName === 'code');
      const classes = code?.properties?.className ?? [];
      const langClass = (Array.isArray(classes) ? classes : [classes]).find(
        (c) => typeof c === 'string' && c.startsWith('language-'),
      );
      const lang =
        (typeof node.properties?.dataLanguage === 'string' ? node.properties.dataLanguage : '') ||
        (langClass ? String(langClass).slice('language-'.length) : '') ||
        'code';

      parent.children[index] = {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['code'] },
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: { className: ['code-lang'] },
            children: [{ type: 'text', value: lang }],
          },
          node,
        ],
      };
    });
  };
}
