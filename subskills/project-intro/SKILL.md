---
name: ppt-project-intro
description: 面向项目介绍、方案汇报、产品介绍和阶段性复盘生成结构化 PPT，适合快速产出背景、方案、里程碑和下一步页面。
---

# PPT Project Intro

这个子 skill 面向项目介绍类 PPT，默认复用 `ppt-maker` 的结构化 deck、预览和导出流程。

## 何时使用

- 用户要做项目介绍、方案汇报、产品介绍
- 用户要讲清背景、目标、方案、进度和下一步
- 用户希望快速起一个偏商务或偏发布会风的成品

## 默认选择

- archetype：`project-intro`
- template：优先 `business-briefing`，也可选 `launch-stage`

## 推荐起稿命令

```bash
node scripts/init_project.js project-intro "项目介绍" --template business-briefing --archetype project-intro
```

## 内容重点

- 背景页先讲问题，再讲为什么现在做
- 方案页不要只列模块，最好有一页结构图或产品图
- 里程碑页强调状态和下一步，而不是堆时间点
- 结尾页要给明确的决策请求或协作诉求
