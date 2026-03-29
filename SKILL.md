---
name: ppt-maker
description: 根据一句话主题、Markdown 或已有文稿生成结构化 PPT，并支持自然语言修改页面与组件后导出为可编辑 PPT。适用于需要生成大纲、创建逐页布局、维护 deck.json、渲染 HTML 预览和导出 .pptx 的场景。
---

# PPT Maker

本技能用于构建和编辑结构化 PPT，而不是将任意 HTML 强行转换成 PowerPoint。

核心工作流是：

`用户输入 -> 创建项目文件夹 -> AI 生成 deck.json -> 预览渲染 -> 自然语言编辑 -> 导出 .pptx`

## 何时使用

当用户提出以下需求时使用本技能：

- 根据一句话主题生成 PPT 大纲与页面
- 根据一段原文或 Markdown 生成演示文稿
- 修改某一页的标题、正文、配图、布局、主题或组件位置
- 为页面或组件增加分步出现动画，并预览动画节奏
- 预览 PPT 页面效果
- 用 skill 自带 viewer 预览指定项目，并查看页内区块信息
- 导出可编辑的 `.pptx`

## 核心原则

- 不要让 AI 直接输出任意 HTML 页面作为最终真相来源
- 所有页面内容都必须落到 `deck.json` 的结构化组件模型里
- 预览与导出必须读取同一份 `deck.json`
- 默认优先保证可编辑性，复杂页面再考虑保真兜底
- 动画优先用结构化 `animation` 字段描述；HTML 预览真实播放，PPT 导出默认用 build slides 模拟

## 目录导航

- `PRD.md`
  说明产品目标、范围和系统设计。
- `references/slide-schema.md`
  定义 `deck.json` 的结构与当前支持的组件。
- `references/layout-rules.md`
  定义版式、字号、间距和溢出控制规则。
- `references/prompt-patterns.md`
  定义大纲生成、页面生成、编辑指令改写的提示词模式。
- `scripts/validate_deck.js`
  校验 deck 数据是否合法。
- `scripts/init_project.js`
  为每个新 PPT 创建独立项目文件夹。
- `scripts/build_project.js`
  在项目目录里一键校验、预览和导出。
- `scripts/open_project_preview.js`
  为指定项目生成并打开 viewer 风格的 `preview.html`。
- `scripts/render_preview.js`
  生成 viewer 风格的 `preview.html`，左侧为页列表，右侧为当前页和区块检视器。
- `scripts/export_ppt.js`
  导出 `.pptx`。
- `scripts/apply_edit.js`
  根据结构化编辑指令更新 deck。
- `scripts/plan_edit.js`
  将自然语言修改命令翻译为结构化 operations。
- `scripts/edit_with_command.js`
  一步完成“自然语言指令 -> deck 修改”。

## 推荐工作流

1. 先创建独立项目目录，路径位于 `projects/<slug>/`。
2. 阅读 `references/slide-schema.md`，确认当前支持哪些页面和组件。
3. 根据用户输入在该项目目录里生成 `deck.json`。
4. 运行项目构建脚本，生成 `preview.html` 和 `output.pptx`。
5. 需要查看页面时，使用 `scripts/open_project_preview.js` 打开项目 viewer。
6. 根据用户反馈继续修改该项目目录里的 `deck.json`。
7. 后续所有预览、编辑和导出都在同一项目文件夹内完成。

## 命令示例

在本技能目录下运行：

```bash
npm install
npm run project:new
npm run validate
npm run preview
npm run export
node scripts/edit_with_command.js samples/example-deck.json "把第二页右侧正文左移一点" outputs/example-command-deck.json outputs/example-command-plan.json
node scripts/init_project.js openclaw-intro "OpenClaw 介绍"
node scripts/build_project.js projects/openclaw-intro
node scripts/open_project_preview.js projects/openclaw-intro
```

## deck 生成要求

- 每个 slide 必须有稳定的 `id`
- 每个 component 必须有稳定的 `id`
- 所有组件必须显式给出 `x`, `y`, `w`, `h`
- 坐标单位统一使用英寸，对齐 PowerPoint 宽屏页面
- 文本内容要控制长度，避免超出布局预算
- 如需动画，优先给组件增加 `animation.effect` 和 `animation.build`

## 自然语言编辑要求

当用户说“改第三页标题”或“把右上角图片放大一点”时：

- 先定位 slide
- 再定位 component
- 然后修改 `deck.json`
- 不要直接只改预览 HTML

对于常见的命令式编辑，优先走：

1. `scripts/plan_edit.js` 生成 operations
2. `scripts/apply_edit.js` 或 `scripts/edit_with_command.js` 应用修改

复杂页面如需保真导出，可以在后续扩展中增加整页位图模式，但默认先保持可编辑对象导出。

## Viewer 约定

- 左侧固定展示 slide 列表与缩略页
- 右侧展示当前页、页码、build 数、组件数和检视面板
- 悬停组件时必须能看到 `slide`、`component id`、`label`、`role`、`type`、坐标尺寸和 AI 编辑提示语
- 点击组件后应锁定该组件信息，方便用户精确描述“修改这一个区块”

## 动画说明

- 预览层支持 `fade-in`、`slide-up`、`zoom-in`
- 导出层默认不依赖 PowerPoint 原生对象动画
- 如组件设置了 `animation.build`，导出时会按 build 顺序展开成多张连续幻灯片
