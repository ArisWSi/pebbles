#!/usr/bin/env node
/**
 * 博客文章模板生成器
 *
 * 用法:
 *   node scripts/new-post.js serif "文章标题"
 *   node scripts/new-post.js mono "文章标题"
 *   npm run new:serif -- "文章标题"
 *   npm run new:mono  -- "文章标题"
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const POSTS_DIR = path.resolve(__dirname, '..', 'src', 'content', 'posts');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[\s]+/g, '-')
    .replace(/[^\w一-鿿-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

function randomHex(len = 4) {
  return crypto.randomBytes(len).toString('hex').substring(0, len);
}

function today() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function createPost(section, title) {
  if (!title) {
    console.error('错误: 请提供文章标题');
    console.error('用法: node scripts/new-post.js serif|mono "文章标题"');
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
  const date = today();
  const filename = `${date}-${slug}.md`;
  const filepath = path.join(POSTS_DIR, filename);

  if (fs.existsSync(filepath)) {
    console.error(`错误: 文件已存在 — ${filename}`);
    process.exit(1);
  }

  let frontmatter = `---
title: ${title}
date: ${date}
section: ${section}
`;

  if (section === 'mono') {
    const hex = randomHex();
    frontmatter += `hex: ${hex}
`;
  }

  frontmatter += `---

`;

  const label = section === 'serif' ? '埋纸地' : 'Five Pebbles';
  frontmatter += `> 发布于 ${label}\n\n`;

  fs.writeFileSync(filepath, frontmatter, 'utf-8');
  console.log(`✓ 已创建: src/content/posts/${filename}`);
  console.log(`  栏目:   ${label}`);
  if (section === 'mono') {
    const hexMatch = frontmatter.match(/hex: (\w+)/);
    console.log(`  hex:    0x${hexMatch[1]}`);
  }
  console.log(`  日期:   ${date}`);
}

// --- main ---
const section = process.argv[2];
const title = process.argv[3];

if (!section || !title) {
  console.log('博客文章模板生成器\n');
  console.log('用法:');
  console.log('  node scripts/new-post.js serif "文章标题"');
  console.log('  node scripts/new-post.js mono  "文章标题"');
  console.log('  npm run new:serif -- "文章标题"');
  console.log('  npm run new:mono  -- "文章标题"');
  process.exit(0);
}

createPost(section, title);
