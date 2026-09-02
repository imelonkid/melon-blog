---
title: "用一段小脚本给照片重命名"
date: 2026-08-18
tag: "技术"
excerpt: "相机导出的照片全是 IMG_4821 这种名字。周末写了个小脚本按拍摄日期批量重命名，记录一下思路和踩的坑。"
---

相机导出的照片全是 `IMG_4821` 这种名字，找起来很痛苦。想翻去年夏天那几张，只能靠系统的日期筛选一点点碰，碰到了还得预览确认。周末花了半小时写了个小脚本，按拍摄日期批量重命名，顺便记录一下。

## 思路

读取每张照片的 EXIF 拍摄时间，把文件名改成「日期-序号」的形式，同一天多张就递增序号。改完之后目录按名字排序，就是天然的时间顺序。

```python
from pathlib import Path
from PIL import Image
from PIL.ExifTags import TAGS

def shot_date(p):
    exif = Image.open(p)._getexif() or {}
    for k, v in exif.items():
        if TAGS.get(k) == "DateTimeOriginal":
            return v[:10].replace(":", "-")
    return "unknown"

for i, p in enumerate(sorted(Path("photos").glob("*.jpg"))):
    p.rename(p.with_name(f"{shot_date(p)}-{i:03d}.jpg"))
```

十几行，够用了。

## 几个坑

**没有 EXIF 的文件。** 截图、从聊天软件存下来的图、别人转发的，都可能没有 `DateTimeOriginal`。上面的写法会把它们统一归到 `unknown`，堆在一起——能接受，但更好的兜底是退回文件的修改时间：

```python
from datetime import date

def shot_date(p):
    exif = Image.open(p)._getexif() or {}
    for k, v in exif.items():
        if TAGS.get(k) == "DateTimeOriginal":
            return v[:10].replace(":", "-")
    # 退回文件修改时间，总比全堆进 unknown 强
    return date.fromtimestamp(p.stat().st_mtime).isoformat()
```

**重名会直接覆盖。** `Path.rename` 在多数平台上遇到同名文件是直接盖掉的，不给任何提示。第一次跑之前，务必先 dry-run 一遍：

```python
for i, p in enumerate(sorted(Path("photos").glob("*.jpg"))):
    print(p.name, "->", f"{shot_date(p)}-{i:03d}.jpg")
```

看一眼输出没问题，再把 `print` 换成 `rename`。这一步花不了十秒钟，但能省掉一次真正的事故。

**序号是全局的，不是按天的。** 上面用的 `enumerate` 是整个目录递增，所以会出现 `2025-07-12-031.jpg` 后面跟着 `2025-07-13-032.jpg` 这种。看着别扭但无害——排序结果是对的。真想按天从 001 开始，就先按日期分组再各自编号。

**别在原目录上跑第一次。** 复制一份出来试，确认无误再对真的动手。备份是最便宜的保险。

## 一点感想

工具不必大。这个脚本没有命令行参数，没有配置文件，路径是写死的，跑完就扔在一边，下次导照片再翻出来改一行路径。它不优雅，但它每次能省下我三分钟的翻找和一点烦躁。

程序员容易犯的一个毛病是，一想到要写工具就开始设计——要不要做成 CLI，要不要支持配置，要不要发到 PyPI 上去。想着想着，那三分钟的麻烦就继续忍着了。
