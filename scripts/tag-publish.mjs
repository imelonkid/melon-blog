/**
 * 上线成功后，在笔记仓库打一个发布 tag。
 * 这个 tag 代表「这个笔记状态已经上线了」，是下次审阅的比较基线。
 *
 * 由 deploy.sh 在验证通过之后调用——**发布失败就不该打 tag**，
 * 否则基线会指向一个从没上线过的状态，下次审阅就漏掉了真正的增量。
 */
import { git, nextPubTag, isDirty, latestPubTag } from './vault.mjs';

if (isDirty()) {
  console.error('  笔记有未提交改动，不打 tag——tag 必须指向一个确定的提交');
  process.exit(1);
}

const prev = latestPubTag();
const head = git('rev-parse', 'HEAD').trim();

// 上次发布之后没有新提交，就别重复打
if (prev) {
  const prevSha = git('rev-list', '-n', '1', prev).trim();
  if (prevSha === head) {
    console.log(`  笔记自 ${prev} 起没有新提交，跳过打 tag`);
    process.exit(0);
  }
}

const tag = nextPubTag();
git('tag', '-a', tag, '-m', `发布于 ${new Date().toLocaleString('sv').slice(0, 16)}`);
console.log(`  ✓ 发布基线 ${tag}${prev ? `（上一个 ${prev}）` : ''}`);
