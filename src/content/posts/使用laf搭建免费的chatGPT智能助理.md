---
title: 搭建免费的chatgpt智能助理
date: 2023-03-28 07:11:48
tags: [laf, AI, chatGPT, openAI]
---
OpenAI 已经公布了 ChatGPT 的API,因为某些原因,我们是直接无法使用API的,但是可以直接通过反代服务来变相访问 ChatGPT API.  
今天教大家如何使用 Laf 调用ChatGPT 的 API,并且自己拥有一个稳定的ChatGPT网站,再也不用受到官网的各种限制了.

### 准备工作
一个ChatGPT账号(需要调ChatGPT 的API key)   
一个Laf 账号(部署使用)   
Node.js 环境(前端页面使用) 

### Laf 介绍
Laf 是一个完全开源的一站式云开发平台，一个开箱即用的云函数，云数据库，对象存储等能力，让你可以像写博客一样写代码。

#### 使用Laf构建ChatGPT应用
首先注册一个自己的账号并且登录 
新注册网址: https://login.laf.dev/signup/laf    
登录成功之后点新建一个应用
    <img src="/images/chatgpt/ai_01.jpg" width = "90%" height="40%" />
然后新建一个应用名称为ChatGPT(名字随便取)
    <img src="/images/chatgpt/ai_02.jpg" width = "50%" height="40%" />
点击进入开发
    <img src="/images/chatgpt/ai_03.jpg" width = "80%" height="40%" />
点NPM，依赖面板中点击右上角的加号
    <img src="/images/chatgpt/ai_04.jpg" width = "90%" height="40%" />
然后输入 chatgpt 并回车进行搜索，选择第一个搜索结果，保存并重启
    <img src="/images/chatgpt/ai_05.jpg" width = "80%" height="40%" />

登录你的ChatGPT账号:
网址: https://chat.openai.com/auth/login
然后去ChatGPT官网生成一个API Key
网址: https://platform.openai.com/account/api-keys
点击页面新增一个key，并且复制保存到记事本。
    <img src="/images/chatgpt/ai_06.jpg" width = "80%" height="40%" />
然后新建一个云函数名字叫 send，
    <img src="/images/chatgpt/ai_07.jpg" width = "80%" height="40%" />
新建完成后写入以下内容：

```js
import cloud from '@lafjs/cloud'

export async function main(ctx: FunctionContext) {
  const { ChatGPTAPI } = await import('chatgpt')
  const data = ctx.body

  // 这里需要把 api 对象放入 cloud.shared 不然无法追踪上下文
  let api = cloud.shared.get('api')
  if (!api) {
    api = new ChatGPTAPI({ apiKey: "你的 api key" })
    cloud.shared.set('api', api)
  }

  let res
  // 这里前端如果传过来 parentMessageId 则代表需要追踪上下文
  if (!data.parentMessageId) {
    res = await api.sendMessage(data.message)
  } else {
    res = await api.sendMessage(data.message, { parentMessageId: data.parentMessageId })
  }
  return res
}
```

将代码中的API key 替换为你的
    <img src="/images/chatgpt/ai_08.jpg" width = "80%" height="40%" />
继续点右上角发布按钮
    <img src="/images/chatgpt/ai_09.jpg" width = "80%" height="40%" />

到此，后端服务部署完成！可以在laf平台上手动测试。

### 配置前端项目
然后打开如下地址,下载前端项目:
地址 :https://github.com/zuoFeng59556/chatGPT

继续编辑view--->index.vue文件
打开地址: https://laf.dev/ ,然后复制你的云函数ID
将下面的index.vue文件里面的ID替换为你的ID
 <img src="/images/chatgpt/ai_10.jpg" width = "80%" height="40%" />

然后运行命令如下:

 ```nodejs
    npm i
    npm run dev
 ```
然后继续运行 

> 注意: 这里需要node环境的支持, 没有node 环境的可以去bing.com搜下 node 安装教程

执行上面的命令后,打开访问地址: http://127.0.0.1:5173/
 <img src="/images/chatgpt/ai_11.jpg" width = "80%" height="40%" />

对话框中测试是否可以正常使用
 <img src="/images/chatgpt/ai_12.jpg" width = "80%" height="40%" />
最后我们我们把页面打包一下并且部署上去,执行如下命令:

```nodejs
npm run build
```

然后继续打开你的 Laf，点击存储界面 --> 点击上方加号 --> 创建一个权限为 readonly 的存储桶（名字随意）。
 <img src="/images/chatgpt/ai_13.jpg" width = "80%" height="40%" />
我这里创建了一个ChatGPT-Web 的桶,将权限一定要设置为公共读
 <img src="/images/chatgpt/ai_14.jpg" width = "80%" height="40%" />
继续上传刚刚打包生成的文件夹`ChatGPT-main/dist ,将文件和文件夹挨个上传.
  <img src="/images/chatgpt/ai_15.jpg" width = "80%" height="40%" />
 <img src="/images/chatgpt/ai_16.jpg" width = "80%" height="40%" />
上传完毕之后，发现右上角有一个 “开启网站托管”，点一下它！
 <img src="/images/chatgpt/ai_17.jpg" width = "80%" height="40%" />
然后打开右上角域名就好了,
能访问后成功!

### 个性化域名
到域名服务商(如阿里云等)配置域名解析记录，这里需要配置为CNAME。其中记录值为laf托管平台生成的域名地址。如：t2eap0-chat-gpt.oss.laf.dev
 <img src="/images/chatgpt/ai_18.jpg" width = "100%" height="60%" />
 配置后等几分钟，访问新域名查看情况。如果可以正常访问，即配置成功。

### 总结
文章中使用的项目源码：
chatGPT前端项目：https://github.com/zuoFeng59556/chatGPT
laf项目：https://github.com/labring/laf
示例网站：http://ai.melonkid.cn