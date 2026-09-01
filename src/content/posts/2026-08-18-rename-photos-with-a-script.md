---
title: "用一段小脚本给照片重命名"
date: 2026-08-18
tag: "技术"
mins: 4
excerpt: "相机导出的照片全是 IMG_4821 这种名字。周末写了个小脚本按拍摄日期批量重命名，记录一下思路和踩的坑。"
---

相机导出的照片全是 IMG_4821 这种名字，找起来很痛苦。周末花了半小时写了个小脚本，按拍摄日期批量重命名，顺便记录一下。

## 思路

读取每张照片的 EXIF 拍摄时间，把文件名改成「日期-序号」的形式，同一天多张就递增序号。

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

## 几个坑

有些截图没有 EXIF，要兜底；重名文件会直接覆盖，先跑一遍 dry-run 更安心。

工具不必大，能省下每次三分钟的翻找，就值得写。
