---
layout: post
title:  "使用github+jeklly搭建博客过程记录"
date:   2017-02-16 17:29:57 +0800
categories: jekyll update
---


##准备工作 
1. 申请git账号，新建一个git仓库，仓库的名称命名格式为：
账号名称.github.io
比如，我的账号是xinyuan6009，那么我的仓库名称为：
xinyuan6009.github.io
2. 本地安装jekll,安装教程请大家自行搜索。安装好jekll后，执行
```shell
    jekll blog
```
就会生成jekll-base的博客工程结构
3. 将生成的blog项目上传到仓库中，访问xinyuan6009.github.io就能看到自己的网站了。

## 自定义主题
刚刚新建的博客项目使用的是jekll默认的主题风格，菜单只有about.我们现在要修改网站标题和菜单项。这时我们就要修改一个比较重要的文件_conf.yml

1. 打开系统默认主题的目录：

```shell
open $(bundle show minima)
```
2. 参考官方文档拷贝修改配置文件
>Suppose you want to get rid of the gem-based theme and convert it to a regular theme, where all files are present in your Jekyll site directory, with nothing stored in the theme gem.

>To do this, copy the files from the theme gem’s directory into your Jekyll site directory. (For example, copy them to /myblog if you created your Jekyll site at /myblog. See the previous section for details.)

>Then remove references to the theme gem in Gemfile and configuration. For example, to remove minima:

>Open Gemfile and remove gem "minima", "~> 2.0".
Open _config.yml and remove theme: minima.
Now bundle update will no longer get updates for the theme gem.

3. 修改_config.yml文件(如添加了自定义导航)

```shell
#theme: minima
gems:
  - jekyll-feed
exclude:
  - Gemfile
  - Gemfile.lock

nav:
  - text: blog
    url: /index.html
  - text: resume
    url: /resume/index.html
  - text: contact
    url: /contact/index.html
  - text: about
    url: /about/index.html
```
4. 在项目根目录添加自定义导航菜单对应的配置模板.md 参考系统默认模板about.md,其他菜单的根据需要自行修改
5. 修改布局文件中导航菜单的部分逻辑，默认主题的导航文件在_incloud/header.html
根据我上面的配置，我的布局模板修改如下：

```html
<div class="trigger">
        {% for my_page in site.nav %}
          {% if my_page.text %}
          <a class="page-link" href="{{ my_page.url | relative_url }}">{{ my_page.text | escape }}</a>
          {% endif %}
        {% endfor %}
      </div>
```

