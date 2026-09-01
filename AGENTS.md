## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## 本项目

- 内容唯一来源是 `src/content/posts/*.md`，frontmatter schema 在 `src/content.config.ts`。
- 样式集中在 `src/styles/global.css`，不要在组件里写散落的内联样式；明暗配色靠顶部 CSS 变量。
- 设计基准是仓库根目录的 `demo.html`（原型导出包），改版式前先对照它。
- Node 版本由 `.npmrc` 的 `use-node-version` 钉住，直接 `pnpm dev` 即可，不必手动 nvm use。
