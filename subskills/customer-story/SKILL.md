---
name: ppt-customer-story
description: 适合客户案例复盘、售前演示和项目展示，并复用 ppt-maker 的结构化 deck、模板和导出流程。
---

# 客户案例介绍

这个子 skill 用于 客户案例介绍 场景，建议与主技能 `ppt-maker` 配合使用。

## 推荐创建方式

在 `/Users/minruiqing/MyProjects/My skills/ppt-maker` 下运行：

```bash
node scripts/init_project.js customer-story-demo "客户案例介绍 Demo" --template business-briefing --archetype customer-story
```

## 适用场景

- 当用户要做 客户案例介绍
- 当内容结构比较固定，适合先用特定大纲起稿
- 当希望默认使用该场景的页面顺序、标题方式和版式语言

## 默认建议

- 先用对应 archetype 创建项目
- 再根据内容替换 `brief.md` 和 `deck.json`
- 视觉模板优先从 `business-briefing`、`launch-stage`、`profile-editorial` 中选择

## 内容提醒

- 保持每页只讲一个重点
- 需要强视觉时优先补封面图和案例图
- 如需新增风格模板或页型变体，请回到主技能 `ppt-maker` 更新 catalog
