---
title: HEXO引入PlanUML
date: 2022-11-06 11:43:23
tags: [UML, hexo, PlanUml]
---

日常开发中经常会绘制一些流程图，类图。在各种绘图工具中，我用的比较多的是PlanUML。因为这个组件不用额外安装软件，直接按照标准语法在自己的文档中编码，PlanUML解析服务就会自动在自己的文档中绘制UML图，并且几乎大部分在线文档平台都支持PlanUML插件了，所以使用成本非常小，非常方便。那么如何在Hexo中使用PlanUML绘制图形呢？

### 添加插件
具体如何实现？一般来说，对于这种场景的工具，Hexo应该已经有现成的插件了。于是我上hexo官网找了下，果然发现了可用的插件。 
![image](/images/plugin.png)

<font size=3 color=green><strong>安装方式：</strong></font>
```js
 npm install --save hexo-filter-plantuml
```

<font size=3 color=green><strong>使用方式：</strong></font>

### 绘制UML
官方的使用方式如下：
![image](/images/planuml_use_1.png)
不过很不幸，这种方式planUML服务器总是提示解析失败
具体效果如下：
```plantuml
@startuml
Object <|-- ArrayList
Object : equals()
ArrayList : Object[] elementData
ArrayList : size()
@enduml
​```

后来查了一些资料，发现通过下面语法可以正常渲染
![image](/images/planuml_demo_1.png)
渲染效果如下：
{% plantuml %}
@startuml
class  face
interface impl
class impl implements face
@enduml
{% endplantuml %}

绘一个简单的流程图：
数据查询场景，用户请求从客户端过来，先经过网关，对用户信息进行统一鉴权。然后网关将请求转发到后端数据服务。数据服务做完参数校验后，将数据返回给客户端。

{% plantuml %}
@startuml
client -> gateway:数据请求
gateway -> gateway : 用户鉴权
gateway -> dataserver: 请求转发
dataserver -> dataserver:参数校验
dataserver -> dataserver:数据查询
dataserver --> gateway: 响应
gateway --> client
@enduml
{% endplantuml %}

