---
title: MAC配置GIT&GITHUB环境
date: 2021-08-18 23:05:31
tags: [mac,git,github]
---
### 安装git
先判断电脑是否已经安装了Git 
直接在命令行执行
```shell
git
```
如果安装过，会输出如下信息
```shell
WMBdeMacBook-Pro:~ WENBO$ git
usage: git [--version] [--help] [-C <path>] [-c name=value]
           [--exec-path[=<path>]] [--html-path] [--man-path] [--info-path]
           [-p | --paginate | --no-pager] [--no-replace-objects] [--bare]
           [--git-dir=<path>] [--work-tree=<path>] [--namespace=<name>]
           <command> [<args>]

These are common Git commands used in various situations:

start a working area (see also: git help tutorial)
   clone      Clone a repository into a new directory
   init       Create an empty Git repository or reinitialize an existing one

work on the current change (see also: git help everyday)
   add        Add file contents to the index
   mv         Move or rename a file, a directory, or a symlink
   reset      Reset current HEAD to the specified state
   rm         Remove files from the working tree and from the index

examine the history and state (see also: git help revisions)
   bisect     Use binary search to find the commit that introduced a bug
   grep       Print lines matching a pattern
   log        Show commit logs
   show       Show various types of objects
   status     Show the working tree status

grow, mark and tweak your common history
   branch     List, create, or delete branches
   checkout   Switch branches or restore working tree files
   commit     Record changes to the repository
   diff       Show changes between commits, commit and working tree, etc
   merge      Join two or more development histories together
   rebase     Reapply commits on top of another base tip
   tag        Create, list, delete or verify a tag object signed with GPG

collaborate (see also: git help workflows)
   fetch      Download objects and refs from another repository
   pull       Fetch from and integrate with another repository or a local branch
   push       Update remote refs along with associated objects

'git help -a' and 'git help -g' list available subcommands and some
concept guides. See 'git help <command>' or 'git help <concept>'
to read about a specific subcommand or concept.
```
如果系统提示找不到命令，那么通过如下方式进行安装
```shell
brew install git
```
> brew安装参考之前的文章

### 创建sshkey&配置git
#### 设置username和email（github每次commit都会记录他们）
```shell
git config --global user.name "imelonkid"
git config --global user.email "imelonkid@163.com"
```
#### 通过终端命令创建ssh key
```shell
ssh-keygen -t rsa -C "imelonkid@163.com"
```
<img style="margin-left: 10px;" src="/posts/mac-git-github/git_generate_sshkey.png" width="968" height="812" />

#### 复制公钥
```shell
cat .ssh/id_rsa.pub
```
### 配置github

1. 登录Github账号，没有自己注册一个
2. 点击右上角头像->setting
    <img style="margin-left: 10px;" src="/posts/mac-git-github/github_set_sshkey1.png" width="762" height="1038" />

3. 选择SSH and GPG keys
    <img style="margin-left: 10px;" src="/posts/mac-git-github/github-set_sshkey2.png" width="1200" height="620" />

4. 点击New SSH Key
标题随便，KEY就是刚刚复制的那个，保存即可
<img style="margin-left: 10px;" src="/posts/mac-git-github/github_set_sshkey3.png" width="1564" height="950" />


5. 验证配置
```shell
ssh -T git@github.com 
```
出现如下提示，表示配置成功
Hi xxx! You've successfully authenticated, but GitHub does not provide shell access.
<img style="margin-left: 10px;" src="/posts/mac-git-github/github_set_sshkey4.png" width="1272" height="124" />


### 将本地已有项目PUSH到github

1. 到项目根目录
1. 执行git初始化
```shell
git init
```

3. 将代码添加缓存区
```shell
git add .
```

4. 将代码提交到本地仓库
```shell
git commit -m "init"
```

5. 将本地代码关联到远程库
```shell
git remote add origin git@github.com:imelokid/melon-commons-lang.git
```

6. 将本地分支关联到远程分支
```shell
git push --set-upstream origin master
```

7. 将本地代码提交到远程仓库
```shell
git push
```
