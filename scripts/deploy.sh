#!/usr/bin/env bash
# 同步 → 构建 → 上线。路径写在这里，不要凭记忆敲 rsync。
set -euo pipefail

REMOTE=melonos
WEBROOT=/opt/1panel/www/sites/melonkid.cn/index/   # 注意：不是 apps/openresty/... 那层
SITE=https://melonkid.cn

cd "$(dirname "$0")/.."

pnpm run sync
pnpm build

# 目标目录必须已存在——rsync 建不出多层父目录，写错路径会以 code 11 失败
ssh "$REMOTE" "test -d $WEBROOT" || { echo "远端目录不存在：$WEBROOT"; exit 1; }
rsync -az --delete dist/ "$REMOTE:$WEBROOT"

echo
echo "首页  $(curl -s -o /dev/null -w '%{http_code} · %{time_total}s' $SITE/)"
echo "文章  $(curl -s $SITE/ | grep -o '[0-9]* POSTS' | head -1)"
