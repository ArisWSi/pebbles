/**
 * pebbles-broadcast — 邮件广播模块
 *
 * 用法:
 *   pebbles broadcast add "a@b.com"
 *   pebbles broadcast remove "a@b.com"
 *   pebbles broadcast list
 *   pebbles broadcast dry-run
 *   pebbles broadcast
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, '.data');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'subscribers.json');
const STATE_FILE = path.join(DATA_DIR, 'broadcast-state.json');
const ENV_FILE = path.join(ROOT, '.env');

// ============================================================
//  .env loader
// ============================================================

function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) return;
  const lines = fs.readFileSync(ENV_FILE, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

// ============================================================
//  subscribers
// ============================================================

function loadSubscribers() {
  if (!fs.existsSync(SUBSCRIBERS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveSubscribers(list) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(list, null, 2) + '\n', 'utf-8');
}

// ============================================================
//  broadcast state
// ============================================================

function getLastBroadcastTime() {
  if (!fs.existsSync(STATE_FILE)) return null;
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    return state.lastBroadcast || null;
  } catch {
    return null;
  }
}

function recordBroadcast() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const state = { lastBroadcast: new Date().toISOString() };
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n', 'utf-8');
}

// ============================================================
//  new posts (reuses pebbles.cjs readPosts)
// ============================================================

function getNewPosts(since) {
  const { readPosts } = require('./pebbles-utils.cjs');
  const all = readPosts();

  if (!since) {
    // first broadcast — ask if all posts should be included
    console.log('这是首次广播。将包含所有文章。');
    return all;
  }

  const sinceDate = since.slice(0, 10); // YYYY-MM-DD
  return all.filter(p => p.date && p.date > sinceDate);
}

// ============================================================
//  email content generation via Claude CLI
// ============================================================

function generateEmailContent(posts) {
  if (posts.length === 0) {
    return { subject: '', body: '' };
  }

  const isSingle = posts.length === 1;
  const postList = posts.map(p => {
    const section = p.section === 'serif' ? '埋纸地' : 'Five Pebbles';
    return `- [${section}]《${p.title}》`;
  }).join('\n');

  const prompt =
    `你是博客"埋纸地 & Five Pebbles"的作者。请以作者本人口吻给订阅者写一封简短邮件，通知他们新发布了文章。\n\n` +
    `要求：\n` +
    `- 用中文写，语气像给朋友写信一样自然、亲切\n` +
    `- ${isSingle ? '一句话介绍这篇文章的亮点' : '每篇文章一句话点到核心趣味'}\n` +
    `- 结尾署名为"—— 埋纸地 & Five Pebbles"\n` +
    `- 末尾附带博客链接 https://ariswsi.github.io/pebbles/\n` +
    `- 总字数不超过 150 字，包括署名和链接\n\n` +
    `新文章：\n${postList}\n\n` +
    `请直接输出邮件正文，不要带任何前缀说明。`;

  console.log('\n正在让 Claude 生成邮件内容...\n');

  let body;
  try {
    // Write prompt to temp file to avoid shell escaping nightmares on Windows
    const tmpFile = path.join(ROOT, '.data', '.broadcast-prompt.txt');
    if (!fs.existsSync(path.dirname(tmpFile))) {
      fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
    }
    fs.writeFileSync(tmpFile, prompt, 'utf-8');

    // On Windows, use cmd.exe to pipe the file content into claude
    const cmd = process.platform === 'win32'
      ? `claude -p --output-format text < "${tmpFile}"`
      : `claude -p "$(cat '${tmpFile}')" --output-format text`;

    body = execSync(cmd, {
      encoding: 'utf-8',
      timeout: 120000,
      cwd: ROOT,
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
    }).trim();

    // Clean up temp file
    try { fs.unlinkSync(tmpFile); } catch {}
  } catch (e) {
    console.error('调用 Claude CLI 失败:', e.message);
    console.error('将使用纯文本回退。');
    body = fallbackEmailBody(posts);
  }

  // generate subject from first post title
  const subject = posts.length === 1
    ? `新文章：${posts[0].title}`
    : `新发布了 ${posts.length} 篇文章`;

  return { subject, body };
}

function fallbackEmailBody(posts) {
  const lines = posts.map(p => {
    const section = p.section === 'serif' ? '埋纸地' : 'Five Pebbles';
    return `· [${section}] ${p.title}`;
  });
  lines.push('');
  lines.push('博客地址：https://ariswsi.github.io/pebbles/');
  lines.push('—— 埋纸地 & Five Pebbles');
  return lines.join('\n');
}

// ============================================================
//  email sending via nodemailer + Gmail SMTP
// ============================================================

function sendEmail(to, subject, html) {
  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  return transporter.sendMail({
    from: `"埋纸地 & Five Pebbles" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    text: html, // plain text, not HTML
  });
}

function formatEmailForDisplay(subject, body) {
  console.log('\n' + '='.repeat(50));
  console.log(`Subject: ${subject}`);
  console.log('='.repeat(50));
  console.log(body);
  console.log('='.repeat(50) + '\n');
}

// ============================================================
//  command entry
// ============================================================

async function cmdBroadcast(subcommand, arg) {
  loadEnv();

  switch (subcommand) {
    case 'add':
      return cmdAdd(arg);
    case 'remove':
    case 'rm':
      return cmdRemove(arg);
    case 'list':
    case 'ls':
      return cmdList();
    case 'dry-run':
    case 'preview':
      return cmdDryRun();
    default:
      return cmdSend();
  }
}

function cmdAdd(email) {
  if (!email || !email.includes('@')) {
    console.error('错误: 请提供有效的邮箱地址');
    console.error('用法: pebbles broadcast add "a@b.com"');
    process.exit(1);
  }

  const subs = loadSubscribers();
  if (subs.includes(email)) {
    console.log(`该邮箱已在订阅列表中: ${email}`);
    return;
  }

  subs.push(email);
  saveSubscribers(subs);
  console.log(`✓ 已添加 ${email}  (共 ${subs.length} 位订阅者)`);
}

function cmdRemove(email) {
  if (!email) {
    console.error('错误: 请提供要移除的邮箱地址');
    console.error('用法: pebbles broadcast remove "a@b.com"');
    process.exit(1);
  }

  let subs = loadSubscribers();
  const idx = subs.indexOf(email);
  if (idx === -1) {
    console.log(`未找到该邮箱: ${email}`);
    return;
  }

  subs.splice(idx, 1);
  saveSubscribers(subs);
  console.log(`✓ 已移除 ${email}  (共 ${subs.length} 位订阅者)`);
}

function cmdList() {
  const subs = loadSubscribers();
  if (subs.length === 0) {
    console.log('还没有订阅者。');
    console.log('用 pebbles broadcast add "a@b.com" 添加。');
    return;
  }

  console.log(`共 ${subs.length} 位订阅者:\n`);
  subs.forEach((email, i) => {
    console.log(`  ${i + 1}. ${email}`);
  });
}

function cmdDryRun() {
  const lastTime = getLastBroadcastTime();
  const posts = getNewPosts(lastTime);

  if (posts.length === 0) {
    console.log('没有新文章。');
    if (lastTime) {
      console.log(`上次广播时间: ${lastTime}`);
    }
    return;
  }

  console.log(`发现 ${posts.length} 篇新文章:\n`);
  posts.forEach(p => {
    const label = p.section === 'serif' ? '埋纸地' : 'Five Pebbles';
    console.log(`  [${label}] ${p.date}  ${p.title}`);
  });

  const { subject, body } = generateEmailContent(posts);
  formatEmailForDisplay(subject, body);
  console.log('[dry-run] 以上为预览内容，邮件未实际发送。');
}

async function cmdSend() {
  const subs = loadSubscribers();
  if (subs.length === 0) {
    console.error('错误: 没有订阅者，无法发送。');
    console.error('先用 pebbles broadcast add "a@b.com" 添加订阅者。');
    process.exit(1);
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('错误: 未配置 Gmail 凭据。');
    console.error('请在 .env 文件中设置 GMAIL_USER 和 GMAIL_APP_PASSWORD。');
    console.error('参考 .env.example 文件。');
    process.exit(1);
  }

  const lastTime = getLastBroadcastTime();
  const posts = getNewPosts(lastTime);

  if (posts.length === 0) {
    console.log('没有新文章可以推送。');
    if (lastTime) {
      console.log(`上次广播时间: ${lastTime}`);
    }
    return;
  }

  console.log(`发现 ${posts.length} 篇新文章，准备发送给 ${subs.length} 位订阅者...\n`);

  const { subject, body } = generateEmailContent(posts);
  formatEmailForDisplay(subject, body);

  console.log(`正在发送邮件...\n`);

  let success = 0;
  let failed = 0;

  for (const email of subs) {
    try {
      await sendEmail(email, subject, body);
      console.log(`  ✓ ${email}`);
      success++;
    } catch (e) {
      console.log(`  ✗ ${email}  — ${e.message}`);
      failed++;
    }
  }

  console.log(`\n发送完成: ${success} 成功, ${failed} 失败`);

  if (success > 0) {
    recordBroadcast();
    console.log('已记录本次广播时间。');
  }
}

module.exports = { cmdBroadcast };
