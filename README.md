# 纸上得来

个人博客。设计还原自 `demo.html`（Claude Design 画布导出的原型），内容用 Markdown 管理，Astro 静态构建。

## 开发

```bash
pnpm install
pnpm dev      # http://localhost:4321
pnpm build    # 输出到 dist/
pnpm preview  # 本地预览构建产物
```

Node 版本由 `.npmrc` 里的 `use-node-version` 钉住（24.20.0），无需手动切 nvm。

## 写一篇新文章

在 `src/content/posts/` 下新建 `YYYY-MM-DD-slug.md`：

```markdown
---
title: "标题"
date: 2026-09-01
tag: "随笔"        # 随笔 / 技术 / 读书 / 杂谈
mins: 3            # 预估阅读分钟数
excerpt: "列表页显示的一句话摘要。"
draft: false       # true 则只在 dev 下可见
---

正文。支持段落、`##` 小标题、`>` 引用、围栏代码块。
```

文件名里的 slug 就是 URL：`/posts/2026-09-01-slug`。字段由 `src/content.config.ts` 做类型校验，写错了构建会直接报错。

插图放 `public/images/`，正文里用 `<figure>` 带图注：

```html
<figure>
  <img src="/images/foo.jpg" alt="描述">
  <figcaption>图注</figcaption>
</figure>
```

`public/images/` 里现有的 `.svg` 是原型留下的占位框，换成真实照片时直接改 `src` 即可。

## 结构

```
src/
  content/posts/     文章 Markdown（唯一的内容来源）
  content.config.ts  frontmatter schema
  consts.ts          站点标题、简介、每页篇数等
  layouts/Base.astro 页头页脚、字体、meta
  components/        列表行、分页
  pages/
    [...page].astro  首页 + 分页（/、/2 …）
    posts/[id].astro 文章页
    about.astro      关于
    rss.xml.ts       RSS
  styles/global.css  全部样式，明暗两套配色令牌
  lib/               取文章、代码块语言标签的 rehype 插件
```

## 明暗主题

跟随系统 `prefers-color-scheme`，两套配色（原型里的「纸张 / 夜色」）定义在 `global.css` 顶部的 CSS 变量里。没有手动切换按钮——需要的话加一个即可，`:root[data-theme]` 的分支已经写好了。

## 部署前

`astro.config.mjs` 里的 `site` 已设为 `https://melonkid.cn`，canonical、sitemap 和 RSS 里的绝对链接都基于它。换域名时改这一处即可。

构建产物是纯静态文件，Vercel / Cloudflare Pages / Netlify 直接托管 `dist/` 即可。

## 部署

站点是纯静态的（构建产物里没有任何独立 JS 文件，脚本内联在 HTML 里），
任何能发静态文件的服务器都能托管，不需要 Node 运行时。

```bash
pnpm build          # 产物在 dist/
```

把 `dist/` 里的内容传到服务器根目录即可。OpenResty / nginx 的配置片段见
[deploy/openresty.conf](deploy/openresty.conf)，涵盖干净 URL、缓存策略、
gzip 和 404 页。

**上传时注意**：站内有中文路径（如 `/posts/令牌桶的java实现`），
用 `rsync` 或 `tar` 传输以保留 UTF-8 文件名；用 zip 跨平台解压容易
把中文名弄成乱码，那些文章会 404。

```bash
rsync -avz --delete dist/ user@host:/path/to/site/
```

## 在 Obsidian 里写，一条命令发布

文章写在 Obsidian vault 的 `melonkid/写点东西/` 目录下，通过同步脚本
搬运到 `src/content/posts/`。Astro 只读自己的目录，不直接访问 vault。

新建文章：在该目录下新建笔记 →
`Cmd+P` → `Templates: Insert template` → 选「博客文章」，得到：

```markdown
---
title:
date: 2026-09-02
tag: 随笔          # 随笔 / 技术 / 读书 / 杂谈
publish: false     # 改成 true 才会被发布
slug:              # 网址用，留空则用文件名
excerpt:           # 留空则自动取正文首段
---
```

写完把 `publish` 改成 `true`，然后：

```bash
blog-deploy        # = 同步 + 构建 + 上传
```

只想同步不发布：`pnpm run sync`。

**同步规则**

- 只搬运 `publish: true` 的笔记，同目录下的草稿不受影响
- 之前发过、现在把 `publish` 改回 `false` 的，会从博客上撤下
- `.obsidian-sync.json` 记录了脚本管理的文件，不要手改

**Obsidian 专有语法的处理**（否则会原样漏到网页上）

| 写法 | 结果 |
|---|---|
| `![[图片.png]]` | 自动在 vault 里找到附件，复制到 `public/images/notes/`，转成标准 markdown |
| `[[双链]]`、`[[双链\|别名]]` | 博客上无处可跳，退化成纯文本 |
| `> [!note] 标题` | 转成普通引用（Astro 不认 callout） |
| `%%批注%%` | 删除 |

## 发布前审阅文章

```
/article-review
```

审阅 `写点东西/` 下的草稿：错别字、语病、文笔与风格、frontmatter 完整性。
只给建议，不直接改文件。

**增量的**——按正文 SHA-1 比对，已审过且没改动的自动跳过：

```bash
pnpm run review:scan            # 看哪些待审
pnpm run review:scan --status   # 看每篇的状态和上次审阅日期
pnpm run review:scan --all      # 忽略记录，全部重审
```

记录存在 `.article-review.json`。只改 frontmatter（比如把 `publish` 改成
`true`）不会触发重审，只有正文变了才算。

## 公式与图表

**数学公式**（构建期渲染成内联 SVG，读者侧零 JS）：

```markdown
$$
T(n) = 2T(n/2) + O(n) \implies T(n) = O(n \log n)
$$
```

只支持 `$$…$$` 块级，**不支持 `$…$` 行内**——站里有文章写着
`$JAVA_HOME/bin:$PATH` 这类 shell 变量，开了行内会把它们当公式解析。

**流程图**（同样构建期渲染成 SVG）：

````markdown
```mermaid
flowchart LR
  A[开始] --> B{判断}
  B -->|是| C[执行]
```
````

配色由 `global.css` 里的 `.prose figure.mermaid` 覆盖，跟随明暗主题。
渲染依赖 Playwright 的无头 Chromium，首次需要：

```bash
pnpm exec playwright install chromium-headless-shell
```

图画错了会让构建失败并指出是第几张，不会静默发一个空白出去。
构建时间因此从 0.4 秒增加到约 3 秒。

## 字体

正文中文用**自托管的思源宋体**（Noto Serif SC，SIL OFL），按 unicode-range
切成 202 个分片（400 / 700 两档字重），浏览器只下载当前页面用到的那几片。
文件全在自己服务器上，国内访问不受制于外部服务。

分片体积大且可复现，**不进 git**。首次克隆或需要重新生成时：

```bash
curl -L -o /tmp/notoserifsc.ttf \
  "https://github.com/google/fonts/raw/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf"
node scripts/build-cjk-font.mjs      # 约一分钟
```

选静态双字重而非可变字体：实测同一区间可变(200-900) 227KB、可变(400-700)
229KB、静态(400) 117KB——裁剪字重范围几乎不省（变体数据是逐字形差值），
换静态直接减半。站点原本用到的 600 已并入 700。

站名的毛笔楷（Ma Shan Zheng）只子集了「纸上得来」四个字，2.1KB。
