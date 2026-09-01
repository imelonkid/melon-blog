---
layout: post
title: 创建文章并部署到Github
date: 2021-08-18 14:52:56
tags: [github,heox]
---

### 将项目关联到github
1. 在github上创建一个仓库，仓库名称必须满足下面格式
${github-userName}.github.io

2. 修改项目的_config.yml文件，修改内容如下
```xml
deploy:
  type: git
  repo: git@github.com:imelokid/imelonkid.github.io.git
  branch: [main]
```
这里面有几点说明  
type: 这里填固定值 git  
repo: 这里填写刚刚创建的仓库地址，注意：这个地址是git@大头的ssh地址，不是https地址  
branch: 这个就填写要上传的分支地址

### 创建文章并部署到github
1. 执行下面命令创建文章
```shell
    hexo new title
```
执行结束，hexo会在项目下的_posts文件夹中创建一个title.md的文件，并且文件头自动生成。

2. 清理项目
```shell
    hexo clean
```
3. 编译项目
```shell
    hexo generate  ## 可以写为 hexo g
```

4. 执行部署
```shell
    hexo deploy  ## 可以写为 hexo d
```