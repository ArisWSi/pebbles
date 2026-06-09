/**
 * pebbles-utils — pebbles.cjs 和 pebbles-broadcast.cjs 共享的工具函数
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname);
const POSTS_DIR = path.join(ROOT, 'src', 'content', 'posts');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w一-鿿-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

function randomHex(len = 4) {
  const crypto = require('crypto');
  return crypto.randomBytes(len).toString('hex').substring(0, len);
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function sectionLabel(s) {
  return s === 'serif' ? '埋纸地' : 'Five Pebbles';
}

function dateToHex(dateStr) {
  const yyyymmdd = dateStr.replace(/-/g, '');
  return parseInt(yyyymmdd, 10).toString(16).slice(-4).padStart(4, '0');
}

function readPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const filepath = path.join(POSTS_DIR, f);
      const raw = fs.readFileSync(filepath, 'utf-8');
      const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
      const meta = {};
      if (fmMatch) {
        fmMatch[1].split('\n').forEach(line => {
          const m = line.match(/^(\w+):\s*(.+)$/);
          if (m) meta[m[1]] = m[2].trim();
        });
      }
      return { file: f, filepath, ...meta };
    })
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

module.exports = { ROOT, POSTS_DIR, slugify, randomHex, todayStr, sectionLabel, dateToHex, readPosts };
