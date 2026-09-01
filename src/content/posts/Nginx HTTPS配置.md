---
title: 个人网站HTTPS配置
date: 2023-03-28 07:10:48
tags: [证书, HTTPS]
---

个人网站升级HTTPS时需要做以下两步 
1. 申请证书
2. 网站配置

---
## 申请证书
腾讯云申请地址：https://console.cloud.tencent.com/ssl

<img src="/images/cert_01.png" width = "60%" height="40%" />

腾讯云证书分两种，收费版和免费版。其中免费版证书只能认证一个域名(包括二级域名)，每个腾讯云账号最多可以申请20个免费证书，每个证书有效期一年。到期后，需要重新申请新证书。
由于我有两个网站，melonkid.cn和note.melonkid.cn。所以需要申请两个证书

> 对于个人网站来说，直接申请免费证书即可。一来收费版非常规，对于个人网站来说，成本太高了。二来免费证书基本上可以满足需求。

<img src="/images/cert_02.jpeg" width = "100%" height="60%" />

之后进入验证环节，按照提示，去域名服务商进行CNAME解析，配置好后，回到申请页面点击网站校验。校验通过后直接提交，进入审核流程。
一般几分钟内就能审核完毕。
<img src="/images/cert_03.jpeg" width = "100%" height="60%" />
如图片所示，找到代理服务器对应的证书下载到本地。


## 安装证书
将证书上传到服务器,可以使用SCP上传
随后配置Nginx服务器
核心配置如下：
```shell
server {
       #SSL 默认访问端口号为 443
       listen 443 ssl;
       #请填写绑定证书的域名
       server_name xxxxx;
       #请填写证书文件的相对路径或绝对路径
       ssl_certificate /root/wxxx/note.melonkid.cn_bundle.crt;
       #请填写私钥文件的相对路径或绝对路径
       ssl_certificate_key /xxx/note.melonkid.cn.key;
       ssl_session_timeout 5m;
       #请按照以下协议配置
       ssl_protocols TLSv1.2;
       #请按照以下套件配置，配置加密套件，写法遵循 openssl 标准。
       ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE;
       ssl_prefer_server_ciphers on;
       location / {
           #网站主页路径。此路径仅供参考，具体请您按照实际目录操作。
           #例如，您的网站主页在 Nginx 服务器的 /etc/www 目录下，则请修改 root 后面的 html 为 /etc/www。
           proxy_pass http://127.0.0.1:8889;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header Host $http_host;
          proxy_redirect off;
       }
       location ~* /(api/kernels/[^/]+/(channels|iopub|shell|stdin)|terminals/websocket)/? {
                proxy_pass            http://127.0.0.1:8889;
                proxy_set_header      Host $host;

                proxy_http_version    1.1;  # websocket support
                proxy_set_header      Upgrade "websocket";
                proxy_set_header      Connection "Upgrade";
                proxy_read_timeout    86400;
        }
        location ~ /terminals/ {
                proxy_pass            http://127.0.0.1:8889;
                proxy_set_header      Host $host;

                proxy_http_version    1.1;  # websocket support
                proxy_set_header      Upgrade "websocket";
                proxy_set_header      Connection "Upgrade";
                proxy_read_timeout    86400;
        }
       error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
   }
```

这里注意，如果要代理websocket，需要配置
```shell
proxy_set_header      Upgrade "websocket";
proxy_set_header      Connection "Upgrade";
```
否则前端请求会被丢弃，这个问题卡了我几乎一整天


### 重启Nginx
1. 检查配置是否正确
```shell
./nginx -t
```

2. 停止Nginx
```shell
./nginx -s stop
```

3. 启动Nginx
```shell
./nginx 
```

