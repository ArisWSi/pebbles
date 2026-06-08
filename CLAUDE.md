# My Blog — Astro 博客项目

## 项目概述

基于 [Astro](https://astro.build/) 框架搭建的中文个人博客。设计灵感源于 [theorangeduck.com](https://theorangeduck.com/)（Daniel Holden），追求质朴、简约、排版至上的阅读体验，同时发展出独立的审美语言。

博客下设两个版块：

| 版块 | 风格 | 气质 | 内容 |
|------|------|------|------|
| **埋纸地** | A1 刻本 (serif) | 大气、温润、书卷气 | 随笔、散文、读书、生活 |
| **Five Pebbles** | B1 终端 (mono) | 俏皮、利落、极客 | 技术笔记、代码日志、短评 |

名字均借意于游戏《雨世界》(Rain World)。

---

## 信息架构

```
首页（轮换文本）
├── 埋纸地 → /serif/          文章列表（纯 slug）
│             └── /posts/<slug>
└── Five Pebbles → /fp/       文章列表（日期 + hex）
                    └── /fp/<YYYY>/<MM>/<hex>
```

- 首页展示一段随机文本（诗、台词、代码、字符画等），下方两个入口链接
- 埋纸地 URL: `/posts/<slug>`
- Five Pebbles URL: `/fp/<YYYY>/<MM>/<hex>`，列表中显示 `0xNNNN` hex ID
- 无关于页面
- RSS 后续施工，暂不实现

---

## 双风格设计规范

### A1 · 刻本 — 埋纸地

温润古典的衬线排版，像翻阅一本排印考究的书。

| 属性 | 值 |
|------|-----|
| **中文字体** | `'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', serif` |
| **英文/代码字体** | `'SF Mono', 'Fira Code', Consolas, 'Courier New', monospace` |
| **字号** | 18px |
| **行高** | 2.0 |
| **背景** | `#faf7f2`（暖纸色） |
| **强调色** | 棕色系 `#8b4513`，点缀 `#c9a87c` |
| **引用线** | 3px 暖棕，斜体 |
| **代码块** | 暖灰底 `#f3efe8`，左侧 3px 棕线 |
| **链接** | `#8b4513` + 下划线，hover 变深 |
| **分割线** | 2px 暖棕，80px 宽 |
| **标题** | 26px，font-weight: 700，letter-spacing: 0.03em |

### B1 · 终端 — Five Pebbles

利落的等宽排版，像翻阅精致的终端笔记。去掉 Holden 的双层画框。

| 属性 | 值 |
|------|-----|
| **字体** | 全站 `'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace` |
| **字号** | 14px |
| **行高** | 2.0 |
| **letter-spacing** | 0.25px |
| **背景** | `#f0f0f0`（中灰页面），内容区 `#fafaf9` |
| **强调色** | 墨绿 `#3d5a3c`（链接）+ 赭石 `#c4792f`（分割线）+ 锈红 `#c15b3d`（hover） |
| **引用线** | 3px `#bcc0b3`，不斜体 |
| **代码块** | `#f0f1ec` 底，2px `#bcc0b3` 边框，字号 11px |
| **行内代码** | 1.5px `#d8dacf` 边框，`#f0f1ec` 底，无圆角 |
| **链接** | `#3d5a3c` + 下划线，hover 变 `#c15b3d` |
| **分割线** | 3px `#c4792f` 赭石色，通宽 |
| **标题** | 16px，font-weight: 400 |

---

## 配色 CSS 变量

```css
/* A1 刻本 — 埋纸地 */
--a1-bg:          #faf7f2;
--a1-bg-code:     #f3efe8;
--a1-text:        #1a1a1a;
--a1-secondary:   #8c8279;
--a1-accent:      #8b4513;
--a1-accent-alt:  #c9a87c;
--a1-border:      #e5dfd5;

/* B1 终端 — Five Pebbles */
--b1-bg-page:     #e6e7e2;
--b1-bg-content:  #f7f7f3;
--b1-bg-code:     #f0f1ec;
--b1-text:        #1a1a1a;
--b1-secondary:   #6e7165;
--b1-accent:      #3d5a3c;   /* 墨绿 — 链接 */
--b1-accent-alt:  #c4792f;   /* 赭石 — 分割线/装饰 */
--b1-rust:        #c15b3d;   /* 锈红 — hover/强调 */
--b1-border:      #bcc0b3;
--b1-code-border: #d8dacf;
```

---

## 排版通用数值

```
内容最大宽度:   680px (A1 衬线) / 760px (B1 等宽)
内容区内边距:   44-50px
段落间距:       1.4-1.5em
页面外边距:     min(5vw, 50px)
代码块内边距:   20-28px
```

---

## 轮换文本框架

首页在构建时从 `src/data/rotations.ts` 中随机选取一条展示。支持多种文本形态：

```ts
// 每条轮换文本
interface Rotation {
  type: 'poem' | 'quote' | 'code' | 'ascii' | 'dialogue'
  content: string      // 正文
  source?: string      // 出处（可选，显示在底部）
}
```

不需要 JS，构建时 `Astro.random()` 选取。用户只需向数组里添加条目即可。

---

## 技术栈

| 类别 | 选择 |
|------|------|
| 框架 | Astro 5.x |
| 内容 | Markdown (`src/content/posts/`)，frontmatter 含 `section: serif | mono` |
| 样式 | 手写 CSS，按风格分文件 |
| 字体 | 系统字体栈，零外部请求 |
| JS | **零** |
| 评论 | 无 |
| 分析 | 无 |

---

## 项目结构

```
myblog/
├── public/
│   └── favicon.ico
├── src/
│   ├── content/
│   │   └── posts/               # 所有 Markdown 文章
│   │       └── *.md             # frontmatter: section, date, hex(可选)
│   ├── data/
│   │   └── rotations.ts         # 首页轮换文本池
│   ├── layouts/
│   │   ├── SerifLayout.astro    # 埋纸地文章布局
│   │   └── MonoLayout.astro     # Five Pebbles 文章布局
│   ├── pages/
│   │   ├── index.astro          # 首页（轮换文本 + 入口）
│   │   ├── serif.astro          # 埋纸地文章列表
│   │   ├── fp.astro             # Five Pebbles 文章列表
│   │   ├── posts/
│   │   │   └── [slug].astro     # 埋纸地文章详情
│   │   └── fp/
│   │       └── [...path].astro  # Five Pebbles 文章详情 (/fp/YYYY/MM/hex)
│   ├── components/
│   │   └── PostItem.astro       # 文章列表项
│   └── styles/
│       ├── serif.css            # 埋纸地全量样式
│       ├── mono.css             # Five Pebbles 全量样式
│       └── landing.css          # 首页专用样式
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

---

## 开发约定

- **命名**: 文件 kebab-case，组件 PascalCase
- **样式**: 手写 CSS，不用框架
- **语义 HTML**: `<article>`、`<main>`、`<nav>`
- **零 JS**: 所有交互效果用 CSS 实现
- **性能目标**: Lighthouse 满分，零外部请求

## 常用命令

```bash
npm run dev          # localhost:4321
npm run build        # 生产构建
npm run preview      # 预览构建
```

---

## 决策记录

- [x] 双风格：埋纸地 (A1 刻本) + Five Pebbles (B1 终端)
- [x] 首页：轮换文本 + 双入口
- [x] URL：埋纸地 `/posts/<slug>`，Five Pebbles `/fp/<YYYY>/<MM>/<hex>`
- [x] B1 去双层画框
- [x] 无关于页
- [x] RSS 暂缓
- [x] 轮换文本框架：构建时随机，`src/data/rotations.ts`
- [ ] 部署平台
- [ ] Five Pebbles hex ID 分配方式
