---
title: Centos下搭建Nginx环境
date: 2023-03-28 06:51:48
tags: [Centos, Nginx]
---

## 前言
最近，在公司经常会进行项目的部署，但是服务器环境都是导师已经搭建好了的，我就是将项目文件放到特定目录。于是，周末在家就进行了 Nginx 的安装学习。之前，在 Windows 上使用过 Nginx，但是在 Linux 环境下 Ngnix 的安装和在 Windows 环境下安装是有一定区别的。这次进行在 Linux 环境下使用源码包的方式安装 Nginx 遇到了不少的问题，但查阅了一些资料也解决了。希望以下的笔记能帮助你们避开这些问题。
Linux 的两种安装方式
首先，介绍一下 Linux 的安装方式，可以是 yum 安装，也可以是源码包安装。

yum 安装：简单方便，不易出错。
源码包安装：有点繁琐，但是服务性能好。

---

## yum 安装
1. 安装 Nginx
yum 安装 nginx 非常简单，就输入一条命令即可。

```shell
sudo yum -y install nginx   # 安装 nginx
sudo yum remove nginx  # 卸载 nginx复制代码使用 yum 进行 Nginx 安装时，Nginx 配置文件在 /etc/nginx 目录下。
```

2. 配置 Nginx 服务

```shell
sudo systemctl enable nginx # 设置开机启动 
sudo service nginx start # 启动 nginx 服务
sudo service nginx stop # 停止 nginx 服务
sudo service nginx restart # 重启 nginx 服务
sudo service nginx reload # 重新加载配置，一般是在修改过 nginx 配置文件时使用。复制代码源码包安装
```

---

## 源码安装
Nginx 源码包安装方式步骤比较繁琐，并且需要提前安装一些 Nginx 依赖库。
### 依赖库安装
> 如果环境已存在依赖包，可跳过以下步骤

1. 安装 gcc 环境
```shell
sudo yum -y install gcc gcc-c++ # nginx 编译时依赖 gcc 环境
```

2. 安装 pcre
```shell
sudo yum -y install pcre pcre-devel # 让 nginx 支持重写功能
```

3. 安装 zlib
```shell
#zlib 库提供了很多压缩和解压缩的方式，nginx 使用 zlib 对 http 包内容进行 gzip 压缩
sudo yum -y install zlib zlib-devel 
```
4. 安装 openssl
```shell
# 安全套接字层密码库，用于通信加密
sudo yum -y install openssl openssl-devel
```

### Nginx安装
以上安装完成后，进行 nginx 安装。
下载nginx源码包，源码包下载地址：nginx.org/en/download…
将准备好的nginx-1.11.5.tar.gz 包，拷贝至/usr/local/nginx目录下（一般习惯在此目录下进行安装）进行解压缩。

```shell
sudo tar -zxvf  nginx-1.11.5.tar.gz # 解压缩复制代码在完成解压缩后，进入 nginx-1.11.5 目录进行源码编译安装。
cd nginx-1.11.5
./configure --prefix=/usr/local/nginx # 检查平台安装环境
# --prefix=/usr/local/nginx  是 nginx 编译安装的目录（推荐），安装完后会在此目录下生成相关文件复制代码如果前面的依赖库都安装成功后，执行 ./configure --prefix=/usr/local/nginx 命令会显示一些环境信息。如果出现错误，一般是依赖库没有安装完成，可按照错误提示信息进行所缺的依赖库安装。
进行源码编译并安装 nginx
make # 编译
make install # 安装复制代码源码包安装与 yum 安装的 nginx 服务操作命令也不同。
```

### 检查配置
```shell
/usr/local/nginx/sbin/nginx -t
```

### 启动服务
```shell
/usr/local/nginx/sbin/nginx
```

### 重新加载服务
```shell
/usr/local/nginx/sbin/nginx -s reload
```

### 停止服务
```shell
/usr/local/nginx/sbin/nginx -s stop复制代码查看 nginx 服务进程
ps -ef | grep nginx # 查看服务进程
```

---

腾讯云服务器是源码安装，tar包在/home/melonkid/lib/nginx-1.9.9.tar.gz \
安装目录：/usr/local/nginx \
配置目录：/usr/local/nginx/conf \
可执行程序目录: /usr/local/nginx/sbin 


