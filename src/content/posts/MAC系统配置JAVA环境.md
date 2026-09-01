---
title: MAC系统配置JAVA环境
date: 2021-08-18 22:40:41
tags: [mac,java,jdk]
---

### 下载
[官网下载地址](https://www.oracle.com/cn/java/technologies/javase/javase-jdk8-downloads.html)
​

### Oracle账号
从ORACLE下载JDK时，需要登录账号。下面是网上找到的一个共享账号，目前可用。  
账号:908344069@qq.com 密码:Java2019 
​

### 配置环境变量

1. 编辑.bash_profile，文件如果不存在就手动创建一个
```shell
vim ~/.bash_profile 

## JDK
JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk1.8.0_301.jdk/Contents/Home
PATH=$JAVA_HOME/bin:$PATH:.
CLASSPATH=$JAVA_HOME/lib/tools.jar:$JAVA_HOME/lib/dt.jar:.
export JAVA_HOME
export PATH
export CLASSPATH
```

2. 使环境变量生效
```shell
source ~/.bash_profile
```

3. 验证是否生效
```shell
java -version
```
