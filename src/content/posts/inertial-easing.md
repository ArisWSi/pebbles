---
title: Inertial Easing 的数学原理
date: 2026-05-22
section: mono
hex: 23ed
description: 用惯性缓动函数模拟自然运动，从弹簧阻尼到临界阻尼的完整推导。
---

惯性缓动（Inertial Easing）是一种让动画看起来「自然」的技术。它不只是在两个关键帧之间插值，而是模拟了一个有质量、有阻尼的物理系统。

## 弹簧-阻尼模型

最基本的模型是一个二阶微分方程：

$$
m\ddot{x} + c\dot{x} + kx = 0
$$

其中 $m$ 是质量，$c$ 是阻尼系数，$k$ 是弹簧刚度。但在实现中，我们通常将其重参数化为：

```rust
fn spring_damper(x: f32, v: f32, target: f32, 
                 stiffness: f32, damping: f32) -> (f32, f32) {
    let force = -stiffness * (x - target);
    let damp = -damping * v;
    let a = force + damp;
    (v + a * DT, a)
}
```

频率 $f$ 和阻尼比 $\zeta$ 是更直观的参数化方式：

- $\zeta < 1$：欠阻尼——物体会振荡，逐渐停在目标位置
- $\zeta = 1$：临界阻尼——最快回到目标位置，不振荡
- $\zeta > 1$：过阻尼——缓慢逼近目标位置，不振荡

> 临界阻尼是 UI 动画的甜点。它既有「物理感」，又不会让用户等待多余的振荡。

## 离散化

连续微分方程需要离散化才能在帧循环中使用。半隐式欧拉方法（Semi-implicit Euler）在实践中效果足够好：

```python
def update(x, v, target, freq, zeta):
    k = (2 * math.pi * freq) ** 2
    c = 4 * math.pi * freq * zeta
    a = -k * (x - target) - c * v
    v_new = v + a * dt
    x_new = x + v_new * dt
    return x_new, v_new
```

先更新速度，再用新速度更新位置——这个顺序让系统无条件稳定，即使使用较大的时间步长也不会爆炸。

---

*一个 0x23ed 号笔记。*
