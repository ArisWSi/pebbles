#!/usr/bin/env node
/**
 * pebbles — 博客管理 CLI
 *
 * 用法:
 *   pebbles new  serif "标题"    创建埋纸地文章
 *   pebbles new  mono  "标题"    创建 Five Pebbles 文章
 *   pebbles list                 列出所有文章
 *   pebbles dev                  启动开发服务器
 *   pebbles build                构建生产版本
 *   pebbles preview              预览构建结果
 *   pebbles sync                 部署到 GitHub Pages
 *   pebbles delete [文件名]      删除文章
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const { ROOT, POSTS_DIR, slugify, randomHex, todayStr, sectionLabel, dateToHex, readPosts } = require('./pebbles-utils.cjs');
const { cmdBroadcast } = require('./pebbles-broadcast.cjs');

const DIST_DIR = path.join(ROOT, 'dist');

// ============================================================
//  commands
// ============================================================

function cmdNew(section, title) {
  if (!title) {
    console.error('错误: 请提供文章标题');
    console.error('用法: pebbles new serif|mono "标题"');
    process.exit(1);
  }

  if (!['serif', 'mono'].includes(section)) {
    console.error('错误: section 必须是 serif 或 mono');
    process.exit(1);
  }

  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  const slug = slugify(title);
  const date = todayStr();
  const filename = `${date}-${slug}.md`;
  const filepath = path.join(POSTS_DIR, filename);

  if (fs.existsSync(filepath)) {
    console.error(`错误: 文件已存在 — ${filename}`);
    process.exit(1);
  }

  let fm = `---
title: ${title}
date: ${date}
section: ${section}
---\n\n`;
  fm += `> 发布于 ${sectionLabel(section)}\n\n`;

  fs.writeFileSync(filepath, fm, 'utf-8');

  console.log(`✓ 已创建  ${filename}`);
  console.log(`  栏目    ${sectionLabel(section)}`);
  console.log(`  日期    ${date}`);
}

function cmdList() {
  const posts = readPosts();
  if (posts.length === 0) {
    console.log('还没有文章。\n');
    console.log('用 pebbles new serif|mono "标题" 创建第一篇。');
    return;
  }

  console.log(`共 ${posts.length} 篇文章\n`);

  const serifPosts = posts.filter(p => p.section === 'serif');
  const monoPosts = posts.filter(p => p.section === 'mono');

  if (serifPosts.length > 0) {
    console.log('埋纸地');
    console.log('──────');
    serifPosts.forEach(p => {
      console.log(`  ${p.date}  ${p.title}`);
    });
    console.log('');
  }

  if (monoPosts.length > 0) {
    console.log('Five Pebbles');
    console.log('────────────');
    monoPosts.forEach(p => {
      const hex = p.date ? dateToHex(p.date) : '    ';
      console.log(`  ${p.date}  0x${hex}  ${p.title}`);
    });
    console.log('');
  }
}

function cmdDev() {
  console.log('启动开发服务器...');
  spawnSync('npx', ['astro', 'dev'], { cwd: ROOT, stdio: 'inherit', shell: true });
}

function cmdBuild() {
  console.log('构建中...');
  spawnSync('npx', ['astro', 'build'], { cwd: ROOT, stdio: 'inherit', shell: true });
}

function cmdPreview() {
  console.log('预览构建结果...');
  spawnSync('npx', ['astro', 'preview'], { cwd: ROOT, stdio: 'inherit', shell: true });
}

function cmdSync() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('错误: dist/ 不存在，请先运行 pebbles build');
    process.exit(1);
  }

  // check if gh-pages is a remote branch or we need to use gh-pages package
  const gitDir = path.join(ROOT, '.git');
  if (!fs.existsSync(gitDir)) {
    console.log('未检测到 Git 仓库，正在初始化...');
    execSync('git init', { cwd: ROOT, stdio: 'inherit' });
  }

  console.log('部署到 GitHub Pages...');
  console.log('');

  // use gh-pages npm package if available, otherwise use manual git push
  try {
    execSync('npx gh-pages -d dist -m "pebbles sync [skip ci]"', {
      cwd: ROOT,
      stdio: 'inherit',
    });
    console.log('');
    console.log('✓ 已部署到 GitHub Pages');
  } catch {
    console.log('');
    console.log('提示: 安装 gh-pages 包后可以自动部署:');
    console.log('  npm install -D gh-pages');
    console.log('');
    console.log('或者手动推送:');
    console.log('  git subtree push --prefix dist origin gh-pages');
  }
}

function cmdDelete(target) {
  const posts = readPosts();
  if (posts.length === 0) {
    console.log('没有可删除的文章。');
    return;
  }

  // if a filename is given, delete directly
  if (target) {
    const found = posts.find(p => p.file === target || p.file.startsWith(target));
    if (!found) {
      console.error(`未找到匹配的文章: ${target}`);
      console.log('用 pebbles list 查看所有文章的文件名。');
      process.exit(1);
    }
    fs.unlinkSync(found.filepath);
    console.log(`✓ 已删除  ${found.file}`);
    return;
  }

  // interactive: numbered list
  console.log('选择要删除的文章（输入序号）:\n');
  posts.forEach((p, i) => {
    const n = String(i + 1).padStart(2, ' ');
    const label = p.section === 'serif' ? '埋纸地' : '5Pebbles';
    console.log(`  ${n}. [${label}] ${p.date}  ${p.title}`);
  });
  console.log('');

  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('序号 (1-' + posts.length + '): ', (answer) => {
    const idx = parseInt(answer, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= posts.length) {
      console.log('已取消。');
    } else {
      const p = posts[idx];
      fs.unlinkSync(p.filepath);
      console.log(`✓ 已删除  ${p.file}`);
    }
    rl.close();
  });
}

// ============================================================
//  main
// ============================================================

const command = process.argv[2];

function help() {
  console.log(`pebbles — 博客管理 CLI

用法:
  pebbles new  serif "标题"    创建埋纸地文章
  pebbles new  mono  "标题"    创建 Five Pebbles 文章
  pebbles list                 列出所有文章
  pebbles dev                  启动开发服务器
  pebbles build                构建生产版本
  pebbles preview              预览构建结果
  pebbles sync                 部署到 GitHub Pages
  pebbles delete [文件名]      删除文章（无参数时交互选择）
  pebbles rm [文件名]          同上
  pebbles broadcast add "邮箱"  添加邮件订阅者
  pebbles broadcast remove "邮箱" 移除邮件订阅者
  pebbles broadcast list        列出订阅者
  pebbles broadcast dry-run     预览广播邮件（不发送）
  pebbles broadcast             发送广播邮件
  pebbles bc ...                同上（简写）
`);
}

switch (command) {
  case 'new':
    cmdNew(process.argv[3], process.argv[4]);
    break;
  case 'list':
    cmdList();
    break;
  case 'dev':
    cmdDev();
    break;
  case 'build':
    cmdBuild();
    break;
  case 'preview':
    cmdPreview();
    break;
  case 'sync':
    cmdSync();
    break;
  case 'delete':
  case 'rm':
    cmdDelete(process.argv[3]);
    break;
  case 'broadcast':
  case 'bc':
    cmdBroadcast(process.argv[3], process.argv[4]);
    break;
  default:
    help();
    break;
}
