---
title: MAC系统配置Maven环境
date: 2021-08-18 22:54:18
tags: [mac,maven]
---
### 下载
网址：[http://maven.apache.org/download.cgi](http://maven.apache.org/download.cgi)
![image](/images/maven_download.png)


### 安装&配置
将下载的压缩包减压到本地，在bash_profile中添加环境变量
```shell
vim ~/.bash_profile
```
```shell
## maven
MAVEN_HOME=/Users/melonkid/Environment/apache-maven-3.8.1
PATH=$MAVEN_HOME/bin:$PATH:.
export MAVEN_HOME
export PATH
```
### ​

### 环境测试
```shell
mvn -v
```
安装成功时，会有如下输出
![image.png](/images/maven_install_err1.png)


### 用户settings.xml配置
maven有用户配置文件和全局配置文件
> 用户配置: ${user.home}/.m2/settings.xml  注意 这个文件不一定存在，不存在的话就手动创建一个
> 全局配置文件: @${MAVEN_HOME}/conf/settings.xml

maven加载配置文件的逻辑是，先使用用户配置，用户配置找不到使用全局的默认配置
​

我网上找了一个比较好用的settings.xml配置，使用了国内的阿里云镜像，可加速二房包下载速度
```xml
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 http://maven.apache.org/xsd/settings-1.0.0.xsd">

    <!-- 默认的值是${user.home}/.m2/repository -->
    <localRepository>/Users/melonkid/.m2/repository</localRepository>

    <!-- 如果Maven要试图与用户交互来得到输入就设置为true，否则就设置为false，默认为true。 -->
    <interactiveMode>true</interactiveMode>

    <!-- 如果Maven使用${user.home}/.m2/plugin-registry.xml来管理plugin的版本，就设置为true，默认为false。 -->
    <usePluginRegistry>false</usePluginRegistry>

    <!-- 如果构建系统要在离线模式下工作，设置为true，默认为false。 如果构建服务器因为网络故障或者安全问题不能与远程仓库相连，那么这个设置是非常有用的。 -->
    <offline>false</offline>

    <mirrors>
        <mirror>
            <id>nexus-aliyun</id>
            <mirrorOf>central</mirrorOf>
            <name>Nexus aliyun</name>
            <url>http://maven.aliyun.com/nexus/content/groups/public/</url>
        </mirror>
    </mirrors>



    <!-- settings.xml中的profile是pom.xml中的profile的简洁形式。 它包含了激活(activation)，仓库(repositories)，插件仓库(pluginRepositories)和属性(properties)元素。 
        profile元素仅包含这四个元素是因为他们涉及到整个的构建系统，而不是个别的POM配置。 如果settings中的profile被激活，那么它的值将重载POM或者profiles.xml中的任何相等ID的profiles。 -->
    <profiles>
        <profile>
            <id>default</id>
            <activation>
                <activeByDefault>true</activeByDefault>
                <jdk>1.8</jdk>
            </activation>
            <repositories>
                <repository>
                    <id>spring-milestone</id>
                    <name>Spring Milestone Repository</name>
                    <url>http://repo.spring.io/milestone</url>
                    <releases>
                        <enabled>true</enabled>
                    </releases>
                    <snapshots>
                        <enabled>false</enabled>
                    </snapshots>
                    <layout>default</layout>
                </repository>
                <repository>
                    <id>spring-snapshot</id>
                    <name>Spring Snapshot Repository</name>
                    <url>http://repo.spring.io/snapshot</url>
                    <releases>
                        <enabled>false</enabled>
                    </releases>
                    <snapshots>
                        <enabled>true</enabled>
                    </snapshots>
                    <layout>default</layout>
                </repository>
            </repositories>
        </profile>
    </profiles>
    <!-- activations是profile的关键，就像POM中的profiles，profile的能力在于它在特定情况下可以修改一些值。 
        而这些情况是通过activation来指定的。 -->
    <!-- <activeProfiles/> -->

</settings>
```