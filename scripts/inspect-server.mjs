/**
 * 服务器巡检 —— 采集风险项，生成 HTML 报告。
 *
 *   pnpm run inspect
 *
 * 报告写到 ~/Workspace/report/，不进仓库（仓库是公开的，报告里有主机细节）。
 *
 * 关于外网端口探测的一个坑：**不能用 nc**。本机跑着 Clash，TUN 模式会把所有
 * TCP 连接就地应答，12345、54321 这种根本没开的端口也会报"连接成功"。
 * 所以这里先拿一个随机高位端口做校准，再按"是否在超时前拿到数据"判断。
 */
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { need } from './paths.mjs';

const SSH = need('BLOG_SSH', '服务器 SSH 别名');
const SITE = need('BLOG_SITE', '站点地址');
const PANEL_PORT = process.env.BLOG_PANEL_PORT ?? '';
const OUT_DIR = process.env.INSPECT_OUT ?? path.join(os.homedir(), 'Workspace/report');

/** 预期对外开放的端口。除此之外任何可达端口都是高危 */
const EXPECTED_PORTS = [22, 80, 443];

const findings = [];
const add = (level, area, title, detail, evidence) =>
  findings.push({ level, area, title, detail, evidence });

// ─────────────────────────── 采集 ───────────────────────────

function remote() {
  const script = `
set +e
echo "###KERNEL_RUNNING###"; uname -r
echo "###KERNEL_INSTALLED###"; rpm -q kernel --qf '%{VERSION}-%{RELEASE}.%{ARCH}\\n' 2>/dev/null | sort -V
echo "###UPDATES_ALL###"; (dnf check-update -q 2>/dev/null | grep -c '^[a-zA-Z]')
echo "###UPDATES_SEC###"; dnf updateinfo list security 2>/dev/null | grep -E '^(TSSA|RHSA|ALSA)'
echo "###SSHD###"; sshd -T 2>/dev/null | grep -iE '^(port|permitrootlogin|passwordauthentication|pubkeyauthentication|maxauthtries)'
echo "###LISTEN###"; ss -tlnH 2>/dev/null | awk '{print $4}' | sort -u
echo "###DISK###"; df -P / | tail -1
echo "###MEM###"; free -m | awk '/^Mem:/{print $2" "$3}'
echo "###LOAD###"; cat /proc/loadavg | awk '{print $1" "$2" "$3}'
echo "###UPTIME###"; awk '{printf "%d", $1/86400}' /proc/uptime
echo "###FAILED_SSH###"; journalctl -u sshd --since '24 hours ago' --no-pager 2>/dev/null | grep -cE 'Failed |Invalid user|Connection closed by authenticating'
echo "###LAST_LOGIN###"; last -n 5 -w 2>/dev/null | head -5
echo "###DOCKER###"; systemctl is-active docker 2>/dev/null
echo "###CONTAINERS###"; docker ps --format '{{.Names}}|{{.Status}}' 2>/dev/null
echo "###CONTAINERS_DOWN###"; docker ps -a --filter 'status=exited' --format '{{.Names}}' 2>/dev/null
echo "###PANEL###"; systemctl is-active 1panel 2>/dev/null || systemctl is-active 1panel-agent 2>/dev/null
echo "###FIREWALL###"; systemctl is-active firewalld 2>/dev/null; echo "iptables_rules=$(iptables -S INPUT 2>/dev/null | grep -c '^-A')"
echo "###FAIL2BAN###"; systemctl is-active fail2ban 2>/dev/null
echo "###ROOT_KEYS###"; grep -c . /root/.ssh/authorized_keys 2>/dev/null
echo "###WORLD_WRITABLE###"; find /opt/1panel/www -maxdepth 3 -type f -perm -o+w 2>/dev/null | head -5
echo "###END###"
`;
  const out = execFileSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15', SSH, 'bash -s'], {
    input: script,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  const sections = {};
  let cur = null;
  for (const line of out.split('\n')) {
    const m = line.match(/^###([A-Z_]+)###$/);
    if (m) { cur = m[1]; sections[cur] = []; continue; }
    if (cur) sections[cur].push(line);
  }
  return Object.fromEntries(
    Object.entries(sections).map(([k, v]) => [k, v.join('\n').trim()]),
  );
}

/**
 * 外网可达性探测。
 * 先用一个随机高位端口校准：如果它也"连上了"，说明本机有 TUN 代理在
 * 伪造连接，此时改用「超时前是否收到数据」来判断。
 */
function probe(host, port, { timeout = 6000 } = {}) {
  return new Promise((resolve) => {
    const started = Date.now();
    const sock = net.connect({ host, port });
    let settled = false;
    let connected = false;
    let gotData = false;
    let timer;

    const done = (verdict) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      sock.destroy();
      resolve({ verdict, ms: Date.now() - started });
    };
    // 兜底计时器，不能只靠 socket.setTimeout：Clash 会直接把连接 FIN 掉，
    // 那种情况下 error 和 timeout 都不触发，Promise 会永远悬着，
    // 事件循环一空 Node 就静默退出——排查了半天才找到。
    timer = setTimeout(() => done(connected && !gotData ? 'filtered' : 'closed'), timeout);

    // 收到数据才算真开放。SSH 会自己先送 banner，HTTP 端口靠这个 HEAD 逼它回话。
    const closing = () => done(gotData ? 'open' : connected ? 'filtered' : 'closed');
    sock.on('connect', () => { connected = true; sock.write('HEAD / HTTP/1.0\r\n\r\n'); });
    sock.on('data', () => { gotData = true; done('open'); });
    sock.on('end', closing);
    sock.on('close', closing);
    sock.on('error', () => done('closed'));
  });
}

async function scanPorts(host) {
  const calib = await probe(host, 51837);
  const tunFaking = calib.verdict !== 'closed';

  const ports = [...new Set([...EXPECTED_PORTS, ...(PANEL_PORT ? [Number(PANEL_PORT)] : [])])];
  const results = {};
  for (const p of ports) results[p] = await probe(host, p);
  return { results, tunFaking, calib };
}

// ─────────────────────────── 判定 ───────────────────────────

function analyze(r, scan, host, certDays) {
  // 1. 对外端口
  for (const [p, res] of Object.entries(scan.results)) {
    const port = Number(p);
    const reachable = res.verdict === 'open';
    if (reachable && !EXPECTED_PORTS.includes(port)) {
      add('high', '网络暴露', `${port} 端口从公网可达`,
        port === Number(PANEL_PORT)
          ? '这是 1Panel 管理面板。面板历史上有过 RCE 级别漏洞，暴露在公网等于把后台交出去。立刻在腾讯云安全组里删掉这条放行规则。'
          : '这个端口不在预期开放列表里，确认是什么服务在监听，不需要就在安全组里关掉。',
        `连接后 ${res.ms}ms 内返回数据`);
    } else if (!reachable && EXPECTED_PORTS.includes(port)) {
      add('high', '网络暴露', `${port} 端口不可达`,
        '这是站点或 SSH 依赖的端口，现在从外网连不上。检查安全组、服务是否还在跑。',
        `探测结果 ${res.verdict}，耗时 ${res.ms}ms`);
    } else if (!reachable && port === Number(PANEL_PORT)) {
      add('ok', '网络暴露', `${port}（管理面板）已被挡在外面`,
        '安全组正常拦截。面板走 SSH 隧道访问即可（alias panel）。',
        `探测结果 ${res.verdict}`);
    } else {
      add('ok', '网络暴露', `${port} 端口正常开放`, '在预期开放列表内。', '');
    }
  }
  if (scan.tunFaking) {
    add('info', '巡检自身', '本机代理会干扰端口探测',
      '校准端口 51837（未开放）也返回了连接成功，说明本机 Clash 处于 TUN 模式。'
      + '本次已改用「超时前是否收到数据」判定，结论仍然可信；但你自己用 nc 测会得到全是"开放"的假象。',
      `校准探测：${scan.calib.verdict} / ${scan.calib.ms}ms`);
  }

  // 2. 安全更新
  //
  // 计数必须按「包名」去重，不能按公告行数。同一个包会在几十条公告里反复出现
  // （kernel 一个包就占了 20 多行），按行数报会得出"54 个更新"这种吓人又没用的数字。
  const secLines = (r.UPDATES_SEC || '').split('\n').filter(Boolean);
  const sev = { Critical: new Set(), Important: new Set(), Moderate: new Set(), Low: new Set() };
  const advisories = { Critical: new Set(), Important: new Set(), Moderate: new Set(), Low: new Set() };
  for (const l of secLines) {
    const parts = l.trim().split(/\s+/);
    const m = l.match(/\b(Critical|Important|Moderate|Low)\b/);
    if (!m) continue;
    const pkg = parts[parts.length - 1].replace(/-\d[^-]*-.*$/, '');  // 去掉版本尾巴
    sev[m[1]].add(pkg);
    advisories[m[1]].add(parts[0]);
  }
  const urgentPkgs = [...new Set([...sev.Critical, ...sev.Important])];
  const minorPkgs = [...new Set([...sev.Moderate, ...sev.Low])].filter((p) => !urgentPkgs.includes(p));
  const urgentAdv = new Set([...advisories.Critical, ...advisories.Important]).size;
  const kernelUrgent = urgentPkgs.some((p) => p.startsWith('kernel'));
  const critCount = advisories.Critical.size;

  if (urgentPkgs.length) {
    add('high', '补丁', `${urgentPkgs.length} 个包有 Critical/Important 安全公告`,
      (critCount ? `其中 ${critCount} 条是 Critical 级。` : '')
      + (kernelUrgent
        ? '这些公告绝大部分是内核漏洞——也就是说 dnf update --security 会装新内核，'
          + '而新内核必须重启才生效。装了不重启等于没打。挑个低峰时段做：'
          + 'dnf update -y --security && reboot，博客中断一两分钟。'
        : '执行 dnf update -y --security 即可，不涉及内核，不需要重启。'),
      `共 ${urgentAdv} 条公告，涉及包：\n` + urgentPkgs.join('  '));
  }
  if (minorPkgs.length) {
    add('warn', '补丁', `${minorPkgs.length} 个包有 Moderate/Low 安全公告`,
      '优先级低于上一项，可以和下次维护一起做。',
      minorPkgs.join('  '));
  }
  if (!urgentPkgs.length && !minorPkgs.length) add('ok', '补丁', '没有待打的安全更新', '', '');

  const allUpd = Number(r.UPDATES_ALL || 0);
  add(allUpd > 100 ? 'warn' : 'ok', '补丁', `${allUpd} 个包可更新（含非安全类）`,
    allUpd > 100 ? '积压偏多，说明很久没做全量更新了。' : '', '');

  // 3. 内核：既看"装了没重启"，也看"有没有更新的可装"
  const running = (r.KERNEL_RUNNING || '').trim();
  const installed = (r.KERNEL_INSTALLED || '').split('\n').map((s) => s.trim()).filter(Boolean);
  const newestInstalled = installed[installed.length - 1];
  const runningBase = running.replace(/\.x86_64$/, '');
  const installedNewer = newestInstalled && !newestInstalled.replace(/\.x86_64$/, '').startsWith(runningBase)
    && installed.length > 1;

  if (installedNewer) {
    add('high', '内核', '新内核已安装但没重启，补丁并未生效',
      `正在跑 ${running}，已装 ${newestInstalled}。重启才会切过去，中断一两分钟。`,
      installed.join('\n'));
  } else if (kernelUrgent) {
    add('warn', '内核', `运行中 ${running}，有高危内核更新待安装`,
      '详见上面的补丁项。更新 + 重启是一起的，单做一半没有意义。',
      installed.join('\n'));
  } else {
    add('ok', '内核', `运行中 ${running}`, '没有待生效的内核更新。', '');
  }

  // 4. SSH 配置
  const sshd = Object.fromEntries(
    (r.SSHD || '').split('\n').filter(Boolean).map((l) => l.trim().split(/\s+/)),
  );
  const rootLogin = sshd.permitrootlogin;
  const pwAuth = sshd.passwordauthentication;
  if (pwAuth === 'yes' && rootLogin === 'yes') {
    add('high', 'SSH', 'root 可以用密码登录',
      '22 端口对全网开放，而 root 是最容易被猜的账号名。立刻关掉密码认证，改用密钥。',
      `permitrootlogin=${rootLogin}  passwordauthentication=${pwAuth}`);
  } else if (pwAuth === 'yes') {
    add('high', 'SSH', '密码认证是开着的',
      '22 端口对全网开放时，密码认证等于把门留了条缝。改成仅密钥登录。',
      `passwordauthentication=${pwAuth}`);
  } else if (rootLogin === 'yes') {
    add('warn', 'SSH', 'PermitRootLogin 是 yes（当前靠密码认证已关兜着）',
      '现在 root 只能用密钥，实际是安全的。但如果哪天在 1Panel 面板上打开了"密码登录"开关，'
      + 'root 就会立刻变成可爆破。写一个 sshd_config.d/60-hardening.conf 设成 prohibit-password 可以钉死。',
      `permitrootlogin=${rootLogin}  passwordauthentication=${pwAuth}`);
  } else {
    add('ok', 'SSH', '仅密钥登录，root 已收紧', '', `permitrootlogin=${rootLogin}  passwordauthentication=${pwAuth}`);
  }

  const keys = Number(r.ROOT_KEYS || 0);
  add(keys > 4 ? 'warn' : 'ok', 'SSH', `root 授权密钥 ${keys} 把`,
    keys > 4 ? '密钥偏多，确认每一把都还在用——离职的同事、换掉的旧电脑都该清掉。' : '',
    '');

  // 5. 爆破尝试
  const failed = Number(r.FAILED_SSH || 0);
  add(failed > 500 ? 'warn' : 'ok', 'SSH', `24 小时内失败登录 ${failed} 次`,
    failed > 500 ? '扫描器活动明显。密钥登录下打不进来，但可以考虑装 fail2ban 减少日志噪音。' : '',
    '');

  // 6. 磁盘
  const [, size, used, , pctRaw, mount] = (r.DISK || '').split(/\s+/);
  const pct = Number((pctRaw || '0').replace('%', ''));
  add(pct >= 90 ? 'high' : pct >= 80 ? 'warn' : 'ok', '资源', `根分区已用 ${pct}%`,
    pct >= 90 ? '磁盘写满会让 nginx、Docker、数据库同时出问题。立刻清日志和旧镜像：docker system prune -a'
      : pct >= 80 ? '还有余量，但该看一眼是什么在长——通常是 Docker 镜像和日志。' : '',
    `${used} / ${size} 挂载于 ${mount}`);

  // 7. 证书
  if (certDays !== null) {
    add(certDays < 14 ? 'high' : certDays < 30 ? 'warn' : 'ok', 'HTTPS',
      `证书还有 ${certDays} 天到期`,
      certDays < 14 ? '证书过期会让整站在浏览器里报红。立刻续期。'
        : certDays < 30 ? '确认 1Panel 的自动续期任务还在跑。' : '',
      '');
  }

  // 8. 服务
  if (r.DOCKER !== 'active') {
    add('high', '服务', 'Docker 没有运行', '站点跑在容器里，Docker 挂了等于站点全挂。', r.DOCKER || '');
  }
  const containers = (r.CONTAINERS || '').split('\n').filter(Boolean);
  const unhealthy = containers.filter((c) => !/Up /.test(c));
  if (unhealthy.length) {
    add('high', '服务', `${unhealthy.length} 个容器不在运行状态`, '', unhealthy.join('\n'));
  } else if (containers.length) {
    add('ok', '服务', `${containers.length} 个容器运行正常`, '', containers.join('\n'));
  }

  // 9. 主机防火墙（信息项，不算风险——这台机器靠云安全组）
  const fw = (r.FIREWALL || '').split('\n')[0];
  add('info', '防火墙', `主机 firewalld：${fw || '未安装'}`,
    '这台机器的边界防护由腾讯云安全组承担，在虚拟机之外执行，比主机 iptables 更靠前。'
    + '主机上没装 firewalld 是有意的：OpenResty 跑在 Docker 里，发布端口本来就绕过 INPUT 链，'
    + '而 firewalld 首次启动要重启 docker、还会和 1Panel 的防火墙页抢管理权。',
    r.FIREWALL || '');

  // 10. 可写文件
  const ww = (r.WORLD_WRITABLE || '').split('\n').filter(Boolean);
  if (ww.length) {
    add('warn', '权限', `站点目录下有 ${ww.length} 个全局可写文件`,
      '任何本地用户都能改这些文件。改成 644。', ww.join('\n'));
  }

  return { sshd, running, containers };
}

// ─────────────────────────── HTML ───────────────────────────

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const LEVEL = {
  high: { label: '高危', cls: 'high', rank: 0 },
  warn: { label: '关注', cls: 'warn', rank: 1 },
  info: { label: '说明', cls: 'info', rank: 2 },
  ok: { label: '正常', cls: 'ok', rank: 3 },
};

function html(meta) {
  const counts = { high: 0, warn: 0, info: 0, ok: 0 };
  findings.forEach((f) => counts[f.level]++);
  const sorted = [...findings].sort((a, b) => LEVEL[a.level].rank - LEVEL[b.level].rank);
  const verdict = counts.high ? '需要立刻处理' : counts.warn ? '有待关注项' : '未发现风险';

  const rows = sorted.map((f) => `
      <article class="item ${LEVEL[f.level].cls}">
        <div class="tags"><span class="lv">${LEVEL[f.level].label}</span><span class="area">${esc(f.area)}</span></div>
        <h3>${esc(f.title)}</h3>
        ${f.detail ? `<p>${esc(f.detail)}</p>` : ''}
        ${f.evidence ? `<pre>${esc(f.evidence)}</pre>` : ''}
      </article>`).join('');

  return `<!doctype html>
<html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>服务器巡检 ${meta.date}</title>
<style>
:root{
  --bg:#fbfaf8; --ink:#1a1a1a; --sub:#6f6d67; --line:#e8e6e1; --card:#fff;
  --high:#b3261e; --high-bg:#fdf0ef; --high-line:#f0c8c4;
  --warn:#8a5a00; --warn-bg:#fdf6e8; --warn-line:#eddcb8;
  --ok:#2f6b45; --ok-bg:#f2f8f4; --ok-line:#cfe3d6;
  --info:#40556e; --info-bg:#f1f4f8; --info-line:#d3dde8;
}
@media (prefers-color-scheme:dark){:root{
  --bg:#161615; --ink:#e6e4df; --sub:#95938c; --line:#31312e; --card:#1e1e1c;
  --high:#ff8a80; --high-bg:#2a1a19; --high-line:#4d2b28;
  --warn:#e8b563; --warn-bg:#272016; --warn-line:#4a3a1e;
  --ok:#89c9a3; --ok-bg:#17231b; --ok-line:#2c4433;
  --info:#a8c0da; --info-bg:#181e26; --info-line:#2c3a4a;
}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);
  font:15px/1.65 -apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB',sans-serif;
  padding:2.5rem 1.25rem 4rem}
.wrap{max-width:820px;margin:0 auto}
header{border-bottom:1px solid var(--line);padding-bottom:1.5rem;margin-bottom:1.75rem}
h1{font:600 1.5rem/1.3 Georgia,'Songti SC',serif;margin:0 0 .5rem}
.meta{color:var(--sub);font-size:.85rem;display:flex;flex-wrap:wrap;gap:.4rem 1.1rem}
.verdict{margin-top:1.1rem;padding:.85rem 1rem;border-radius:8px;font-weight:600;
  background:var(--ok-bg);border:1px solid var(--ok-line);color:var(--ok)}
.verdict.has-high{background:var(--high-bg);border-color:var(--high-line);color:var(--high)}
.verdict.has-warn{background:var(--warn-bg);border-color:var(--warn-line);color:var(--warn)}
.tally{display:flex;gap:.5rem;flex-wrap:wrap;margin:1.1rem 0 0}
.tally span{font-size:.8rem;padding:.28rem .7rem;border-radius:999px;border:1px solid var(--line);color:var(--sub)}
.tally .n-high{color:var(--high);border-color:var(--high-line);background:var(--high-bg);font-weight:600}
.tally .n-warn{color:var(--warn);border-color:var(--warn-line);background:var(--warn-bg)}
.item{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--line);
  border-radius:8px;padding:1rem 1.15rem;margin-bottom:.75rem}
.item.high{border-left-color:var(--high);background:var(--high-bg);border-color:var(--high-line)}
.item.warn{border-left-color:var(--warn)}
.item.info{border-left-color:var(--info)}
.item.ok{border-left-color:var(--ok-line);opacity:.82}
.tags{display:flex;gap:.5rem;align-items:center;margin-bottom:.4rem}
.lv{font-size:.72rem;font-weight:700;letter-spacing:.04em;padding:.15rem .5rem;border-radius:4px;
  background:var(--line);color:var(--sub)}
.high .lv{background:var(--high);color:#fff}
.warn .lv{background:var(--warn);color:#fff}
.ok .lv{background:var(--ok-bg);color:var(--ok);border:1px solid var(--ok-line)}
.info .lv{background:var(--info-bg);color:var(--info);border:1px solid var(--info-line)}
.area{font-size:.75rem;color:var(--sub)}
.item h3{margin:0;font-size:1rem;font-weight:600}
.high h3{color:var(--high)}
.item p{margin:.5rem 0 0;color:var(--sub);font-size:.9rem}
.high p{color:var(--ink)}
pre{margin:.7rem 0 0;padding:.65rem .8rem;background:var(--bg);border:1px solid var(--line);
  border-radius:6px;overflow-x:auto;font:12px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;
  color:var(--sub);white-space:pre-wrap;word-break:break-all}
footer{margin-top:2.5rem;padding-top:1.25rem;border-top:1px solid var(--line);
  color:var(--sub);font-size:.8rem}
code{font:12px/1.5 ui-monospace,Menlo,monospace;background:var(--line);padding:.1rem .35rem;border-radius:3px}
</style></head><body><div class="wrap">
<header>
  <h1>服务器巡检报告</h1>
  <div class="meta">
    <span>${esc(meta.date)} ${esc(meta.time)}</span>
    <span>主机 ${esc(meta.host)}</span>
    <span>站点 ${esc(SITE)}</span>
    <span>已运行 ${esc(meta.uptime)} 天</span>
    <span>负载 ${esc(meta.load)}</span>
  </div>
  <div class="verdict ${counts.high ? 'has-high' : counts.warn ? 'has-warn' : ''}">${verdict}</div>
  <div class="tally">
    <span class="${counts.high ? 'n-high' : ''}">高危 ${counts.high}</span>
    <span class="${counts.warn ? 'n-warn' : ''}">关注 ${counts.warn}</span>
    <span>说明 ${counts.info}</span>
    <span>正常 ${counts.ok}</span>
  </div>
</header>
${rows}
<footer>
  由 <code>pnpm run inspect</code> 生成。探测从本机发起，端口结论已针对本机代理做过校准。<br>
  报告只存在本地 <code>~/Workspace/report/</code>，不进公开仓库。
</footer>
</div></body></html>`;
}

// ─────────────────────────── 主流程 ───────────────────────────

async function main() {
  const host = execFileSync('ssh', ['-G', SSH], { encoding: 'utf8' })
    .split('\n').find((l) => l.startsWith('hostname '))?.slice(9).trim() ?? SSH;

  const r = remote();
  const scan = await scanPorts(host);

  let certDays = null;
  try {
    const domain = new URL(SITE).hostname;
    const out = execFileSync('bash', ['-c',
      `echo | openssl s_client -servername ${domain} -connect ${domain}:443 2>/dev/null | openssl x509 -noout -enddate`,
    ], { encoding: 'utf8' });
    const end = out.match(/notAfter=(.+)/);
    if (end) certDays = Math.round((new Date(end[1]) - Date.now()) / 864e5);
  } catch { /* 拿不到就不报这一项 */ }

  analyze(r, scan, host, certDays);

  const now = new Date();
  const date = now.toLocaleDateString('sv');              // YYYY-MM-DD
  const time = now.toTimeString().slice(0, 5);
  const meta = {
    date, time, host,
    uptime: r.UPTIME || '?',
    load: (r.LOAD || '').split(' ')[0] || '?',
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `巡检-${date}.html`);
  fs.writeFileSync(file, html(meta));
  fs.writeFileSync(path.join(OUT_DIR, 'latest.html'), html(meta));

  const c = { high: 0, warn: 0 };
  findings.forEach((f) => { if (c[f.level] !== undefined) c[f.level]++; });
  console.log(`\n  巡检完成：高危 ${c.high} · 关注 ${c.warn}`);
  console.log(`  报告：${file}`);
  if (c.high) {
    console.log('\n  高危项：');
    findings.filter((f) => f.level === 'high').forEach((f) => console.log(`    ✗ [${f.area}] ${f.title}`));
  }
  process.exitCode = c.high ? 2 : 0;
}

main().catch((e) => {
  console.error('巡检失败：', e.message);
  process.exit(1);
});
