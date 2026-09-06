#!/usr/bin/env bash
# 纸上得来 —— 发布流程。审阅 → 同步 → 体检 → 构建 → 上线 → 验证。
# 任一步失败就停，不会把半成品推上去。
#
# 服务器坐标全部来自环境变量，定义在 ~/.zsh/conf.d/env.zsh 的「纸上得来」一段。
# 仓库是公开的，所以这里只出现变量名。
set -euo pipefail

for v in BLOG_REPO BLOG_SITE BLOG_SSH BLOG_WEBROOT; do
  [[ -n "${!v:-}" ]] || {
    echo "缺少环境变量 $v —— 见 ~/.zsh/conf.d/env.zsh 的「纸上得来」一段"
    echo "刚加过的话，开个新终端或 source ~/.zshrc"
    exit 1
  }
done

cd "$BLOG_REPO"

echo "▸ 同步 Obsidian"        ; pnpm run sync        # 缺图会在这里非零退出
echo "▸ 上线前检查"           ; pnpm run preflight   # 断链 / 未审阅 / draft 泄漏
echo "▸ 构建"                 ; pnpm build

# rsync 建不出多层父目录，路径写错只会报 code 11 而不说原因，所以先探一下
echo "▸ 检查远端目录"
ssh "$BLOG_SSH" "test -d '$BLOG_WEBROOT'" || {
  echo "远端目录不存在：$BLOG_WEBROOT"
  echo "确认 BLOG_WEBROOT 是站点根（1Panel 的 www/sites/<域名>/index），不是 apps/openresty 那层"
  exit 1
}

echo "▸ 上传"
rsync -az --delete dist/ "$BLOG_SSH:$BLOG_WEBROOT"

echo
echo "▸ 线上验证"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BLOG_SITE/")
printf '  首页    %s · %ss\n' "$code" "$(curl -s -o /dev/null -w '%{time_total}' "$BLOG_SITE/")"
printf '  文章    %s\n' "$(curl -s "$BLOG_SITE/" | grep -o '[0-9]* POSTS' | head -1)"
[[ "$code" == 200 ]] || { echo "  首页不是 200，去看 nginx"; exit 1; }
echo "  ✓ 已上线 $BLOG_SITE"

# 验证通过之后才打发布 tag。失败时不打——否则基线会指向一个从没上线的状态，
# 下次审阅就会漏掉真正的增量
echo
echo "▸ 记录发布基线"
node scripts/tag-publish.mjs
