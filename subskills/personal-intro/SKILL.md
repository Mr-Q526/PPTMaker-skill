---
name: ppt-personal-intro
description: 面向个人介绍、自我介绍、嘉宾简介和作品集场景生成结构化 PPT，适合快速产出人物定位、经历、代表项目和结尾页。
---

# PPT Personal Intro

这个子 skill 面向个人介绍类 PPT，默认复用 `ppt-maker` 的结构化 deck、预览和导出流程。

## 何时使用

- 用户要做个人介绍、自我介绍、嘉宾介绍
- 用户要做作品集首页、个人陈述、求职展示
- 用户希望突出人物标签、经历、项目和风格

## 默认选择

- archetype：`personal-intro`
- template：优先 `profile-editorial`，也可选 `launch-stage`

## 推荐起稿命令

```bash
node scripts/init_project.js personal-profile "个人介绍" --template profile-editorial --archetype personal-intro
```

## 内容重点

- 第一页要让观众快速记住“你是谁”
- 经历页不要写成简历全文，优先保留转折和亮点
- 代表项目页优先一页只讲一个代表案例
- 结尾页要给一句能被记住的话
