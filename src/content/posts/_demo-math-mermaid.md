---
title: "公式与图表演示"
date: 2026-09-04
tag: 技术
draft: true
excerpt: "本地预览用的渲染样例，不会发布到线上。"
---

这篇是本地预览用的样例，`draft: true`，不会出现在线上。

## 行内代码不受影响

公式只认 `$$…$$` 块级，所以 shell 变量是安全的：

配置 Maven 时要写 `export PATH=$MAVEN_HOME/bin:$PATH`，
Java 则是 `export PATH=$JAVA_HOME/bin:$PATH`。

## 数学公式

归并排序的递归式与其解：

$$
T(n) = 2T\left(\frac{n}{2}\right) + O(n) \implies T(n) = O(n \log n)
$$

行内引用也可以放在块里，比如二分查找每次把区间减半：

$$
\log_2 1000000 \approx 20
$$

带希腊字母和求和：

$$
\sigma^2 = \frac{1}{N}\sum_{i=1}^{N}(x_i - \mu)^2
$$

## 流程图

```mermaid
flowchart LR
  A[用户提问] --> B{需要工具吗}
  B -->|否| C[直接回答]
  B -->|是| D[领域路由]
  D --> E[意图解析]
  E --> F[调用工具]
  F --> C
```

## 时序图

```mermaid
sequenceDiagram
  participant 读者
  participant 浏览器
  participant 服务器
  读者->>浏览器: 打开文章
  浏览器->>服务器: 请求页面
  服务器-->>浏览器: 返回 HTML
  Note over 浏览器: 图和公式都已是<br/>构建期渲染好的
  浏览器-->>读者: 直接显示
```

## 状态图

```mermaid
stateDiagram-v2
  [*] --> 草稿
  草稿 --> 待审: 写完
  待审 --> 草稿: 有问题
  待审 --> 已发布: 通过
  已发布 --> [*]
```
