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

```bash
blog-deploy
```

一条命令走完：**同步 Obsidian → 上线前检查 → 构建 → 探远端目录 → 上传 → 验证首页**。
任一步失败就停，不会把半成品推上去。完整说明见
[docs/发布流程.md](docs/发布流程.md)。

不要绕过它手敲 `rsync`——路径写错时 rsync 只报 `code 11 error in file IO`，
不会告诉你是路径不存在。脚本里的远端目录探测就是为这个加的。

服务器主机、路径、面板端口都是环境变量（`BLOG_*`），定义在
`~/.zsh/conf.d/env.zsh`。仓库是公开的，代码和文档里只出现变量名，
换服务器只改那一处。

站点是纯静态的（构建产物里没有独立 JS 文件，脚本内联在 HTML 里），
不需要 Node 运行时。OpenResty / nginx 配置片段见
[deploy/openresty.conf](deploy/openresty.conf)。

**站内有中文路径**（如 `/posts/令牌桶的java实现`），传输要用 `rsync` 或 `tar`
保留 UTF-8 文件名；zip 跨平台解压容易把中文名弄成乱码，那些文章会 404。

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

## 本地预览用的草稿

`src/content/posts/` 下 `draft: true` 的文章**只在 `pnpm dev` 下可见**，
不进构建产物、不上线、不进 RSS 和 sitemap。用来验证排版和渲染效果而
不污染线上内容。

`_demo-math-mermaid.md` 是常驻的渲染样例，包含公式、流程图、时序图、
状态图，改动排版后可以拿它对照。

注意它和 Obsidian 里的 `publish: false` 是两套机制：`publish` 控制
**要不要从 Obsidian 同步过来**，`draft` 控制**同步过来后要不要构建**。

## 发布前审阅文章

```
/article-review
```

审阅 `写点东西/` 下的草稿：错别字、语病、文笔与风格、图片、frontmatter、标签。
只给建议，不直接改文件。

**每篇上线前都要过一遍，没有例外。** `blog-deploy` 里的 preflight 会核对审阅
记录——标了 `publish: true` 却没审过、或者审完又改了正文的，直接挡住发布。

**增量的**——按正文 SHA-1 比对，已审过且没改动的自动跳过：

```bash
pnpm run review:scan            # 看哪些待审
pnpm run review:scan --status   # 看每篇的状态和上次审阅日期
pnpm run review:scan --all      # 忽略记录，全部重审
```

记录存在 `.article-review.json`。只改 frontmatter（比如把 `publish` 改成
`true`）不会触发重审，只有正文变了才算。

## 两个时间

| 字段 | 含义 | 谁来填 |
|---|---|---|
| `date` | 发表日，**上线后不再改** | 写文章时 |
| `updated` | 实质修改日 | 审阅时自动写回 |

`date` 决定首页排序和 RSS 的 `pubDate`。改老文章的 `date` 会让它跳回首页
顶部、让订阅者收到重复推送——所以修订记在 `updated`，页面上显示成
「更新于 X」，只在它晚于 `date` 时出现。

`updated` 由 `review-scan --mark` 自动写入 Obsidian：这篇**已经上线过**、
且正文 SHA-1 变了，才会写。还没发布的草稿改来改去不算更新。

Obsidian 模板由白名单生成，标签有增减就重跑：

```bash
pnpm run template
```

（手抄白名单必然会漂——加这个脚本的当天我就凭记忆抄错过一次。）

## 上线前检查

```bash
pnpm run preflight
```

`blog-deploy` 会自动跑。每条规则都对应踩过的坑：

| 检查 | 因为什么加的 |
|---|---|
| 缺图 | Obsidian 里挪动附件后链接变成 `![[子目录/图.png]]`，同步匹配不上，图悄悄没了 |
| 图片断链 | 正文引用的 `/images/...` 在 `public/` 下不存在 |
| 百分比宽高 | 裸 `<img width="80%">` 让浏览器算不出高度，刷新时页面会跳 |
| 未审阅 | 标了 `publish` 却没过 `/article-review` |
| draft 泄漏 | 本地预览用的草稿混进了构建产物 |

`.image-exceptions.json` 只记录 2017 年迁移时源头就丢了的老图。
**新文章断链一定是同步或路径出了问题，去修，不要往里加。**

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

正文用**系统字体**：Mac 命中 Songti SC，Windows 命中 SimSun，Linux 命中
思源宋体，西文优先 Georgia。中文网络字体不管谁托管都是 MB 级（实测自托管
思源宋体单页要下 1.4MB），而系统里本来就有可用的宋体——零下载、首屏即成形、
没有字体到达后的重排。代价是不同系统字形略有差异。

两处例外，都是系统字体替代不了的，且都自托管并配了长缓存：

- **站名**的毛笔楷（Ma Shan Zheng）只子集了「纸上得来」四个字，2.1KB
- **公式**的 KaTeX 数学字体，296KB（只留 woff2），且只有含公式的文章才引入

若哪天想要统一字形，`scripts/build-cjk-font.mjs` 能生成自托管的思源宋体
分片（按 unicode-range 切片，只下载页面用到的那几片），跑完在 Base.astro
里 link 上即可。
