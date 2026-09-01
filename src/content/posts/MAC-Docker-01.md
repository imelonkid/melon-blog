---
title: Mac使用Docker搭建MYSQL开发环境
date: 2022-12-09 09:05:31
tags: [Mac,Docker]
---

### 下载安装
网址：https://www.docker.com/
从上诉网址下载MAC平台的安装包，注意MAC要下载对应芯片的安装包。M1芯片之前的下载Intel版，否则下载Apple版本

下载好之后，点击安装包直接安装，按提示将APP拖拽到Application目录中。

### 安装MYSQL
Docker有一个镜像库，里面包含了各种常用的服务，MYSQL的服务也在里面。镜像库地址：https://hub.docker.com
#### 指定版本下载
1. 查询MYSQL已有版本
```shell
    docker search mysql
```
2. 下载指定版本MYSQL
```shell
    docker pull mysql:version
```
3. 也可以指定最新版本
```shell
    docker pull mysql:latest
    //或则
    docker pull mysql
```
4. 查看已安装的镜像
```shell
    docker images
```
5. 启动MYSQL服务
```shell
    docker run -itd --name melondb -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 mysql
```
6. 查看Docker进程是否已包含MYSQL
```shell
    docker ps
```
7. 远程登录MYSQL
```shell
    mysql -h localhost -u root -p
```
> 注意，因为mysql是Docker进程，不是直接安装到电脑本地。所以直接在终端执行下面命令时可能会报找不到命令。这种情况可以直接在docker命令行下执行。如下图所示：
<img src="/images/docker-mysql.jpg" width = "100%" height="60%" />

### 安装MYSQL客户端
MYSQL客户端有很多，这里我使用phpmyadmin。
地址：https://www.phpmyadmin.net/
phpmyadmin方便之处是他提供了现成的Docker镜像包，可以直接启动phpmyadmin Docker进程Link到Docker MYSQL进程。

