/**
 * 首页轮换文本数据
 *
 * 构建时随机选取一条展示。往下面数组中添加入口即可。
 *
 * type:
 *   'poem'     — 诗/短句，用 <blockquote> 渲染，斜体居中
 *   'quote'    — 引用/台词，用 <blockquote> 渲染
 *   'code'     — 代码片段，用 <pre> 渲染，等宽字体
 *   'ascii'    — 字符画，用 <pre> 渲染，保留空白
 *   'dialogue' — 对话/剧本段落，用 <blockquote> 渲染
 */

export interface Rotation {
  /** 内容类型，决定渲染方式 */
  type: 'poem' | 'quote' | 'code' | 'ascii' | 'dialogue'

  /** 正文。多行文本用 \n 分隔。code/ascii 类型保留所有空白。 */
  content: string

  /** 出处（可选），显示在文本底部 */
  source?: string
}

const rotations: Rotation[] = [

  // ==============================================
  //  往下添加你自己的轮换文本
  // ==============================================

  // --- 诗 ---
  {
    type: 'poem',
    content: '你不需要理解这一切。\n你只需要知道——\n每一场雨都会停。',
    source: 'Rain World',
  },

  // --- 引用 ---
  {
    type: 'quote',
    content: 'The cycles are countless, but each one is a chance.',
    source: 'Five Pebbles',
  },

  // --- 代码 ---
  {
    type: 'code',
    content: `fn main() {
    println!("hello, world");
    // what else is there to say?
}`,
    source: 'a rust program',
  },

  // --- ASCII 字符画 ---
  {
    type: 'ascii',
    content: `    .-""-.     .-""-.
   /      \\   /      \\
  |        | |        |
  |  .--.  | |  .--.  |
  | (    ) | | (    ) |
   \\      /   \\      /
    '-..-'     '-..-'

     two pebbles
     looking at each other`,
    source: 'ascii art',
  },

  // --- 对话 ---
  {
    type: 'dialogue',
    content: '— 为什么要写博客？\n— 因为纸埋在地里会烂，卵石扔进雨里还能捡起来。\n— ……什么意思？\n— 我也不知道。',
    source: '一段对话',
  },
]

export default rotations
