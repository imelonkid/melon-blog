/**
 * 部署与内容相关的坐标统一从环境变量读，定义在 ~/.zsh/conf.d/env.zsh。
 * 仓库是公开的，路径和主机不写进代码；换服务器只改那一个文件。
 */
import path from 'node:path';

export function need(name, hint) {
  const v = process.env[name];
  if (!v) {
    console.error(`\n缺少环境变量 ${name}${hint ? `（${hint}）` : ''}`);
    console.error('定义在 ~/.zsh/conf.d/env.zsh 的「纸上得来」一段。');
    console.error('如果刚加过，开个新终端或者 source ~/.zshrc 再试。\n');
    process.exit(1);
  }
  return v;
}

export const ROOT = path.resolve(import.meta.dirname, '..');
export const vaultSrc = () => need('BLOG_SRC', 'Obsidian 草稿目录');
export const vaultRoot = () => need('BLOG_VAULT', 'Obsidian vault 根目录');
