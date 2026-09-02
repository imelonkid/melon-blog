import { visit } from 'unist-util-visit';

/** 超过这个行数的代码块会被截断，并给出「展开全部」控件 */
const LONG_THRESHOLD = 30;

/**
 * 数代码块行数。Shiki 会把高亮结果作为 raw 节点塞进 <pre>，
 * 只收集 text 节点会得到 0，所以两种节点都要收。
 */
function countLines(node) {
  const acc = [];
  (function collect(n) {
    if (n.type === 'text' || n.type === 'raw') { acc.push(String(n.value ?? '')); return; }
    n.children?.forEach(collect);
  })(node);
  const blob = acc.join('');
  // Shiki 每行一个 <span class="line">，优先用它；未高亮时退回数换行
  const spans = (blob.match(/class="line"/g) || []).length;
  return spans || blob.replace(/\n$/, '').split('\n').length;
}

const el = (tagName, properties, children = []) => ({
  type: 'element',
  tagName,
  properties,
  children,
});

/**
 * 还原原型里的代码块外观：外面包一层带语言标签栏的边框盒子。
 * <pre> → <figure class="code"><div class="code-lang">PYTHON</div><pre>…</pre></figure>
 *
 * 全站 143 个代码块里中位数只有 3 行，绝大多数不需要任何折叠控件；
 * 只有超过 LONG_THRESHOLD 行的才额外加截断和展开控件（纯 CSS，无 JS）。
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

      const lines = countLines(node);
      const isLong = lines > LONG_THRESHOLD;

      const children = [
        el('div', { className: ['code-lang'] }, [{ type: 'text', value: lang }]),
        el('div', { className: ['code-body'] }, [node]),
      ];

      if (isLong) {
        children.push(
          el('details', { className: ['code-expand'] }, [
            el('summary', { dataLines: String(lines) }),
          ]),
        );
      }

      parent.children[index] = el(
        'figure',
        { className: isLong ? ['code', 'is-long'] : ['code'] },
        children,
      );
    });
  };
}
