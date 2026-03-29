---
name: ppt-maker
description: 根据一句话主题、Markdown 或已有文稿生成结构化 PPT，并支持自然语言修改页面与组件后导出为可编辑 PPT。适用于需要生成大纲、创建逐页布局、维护 deck.json、渲染 HTML 预览和导出 .pptx 的场景。
---

# PPT Maker

本技能用于构建和编辑结构化 PPT，而不是将任意 HTML 强行转换成 PowerPoint。

核心工作流是：

`用户输入 -> 创建项目文件夹 -> AI 生成 deck.json -> 预览渲染 -> 自然语言编辑 -> 导出 .pptx`

当前系统新增了三层组织能力：

- `template`：控制整体视觉风格和推荐版式
- `archetype`：控制某类 PPT 的默认结构和起稿页序
- `subskills/`：为个人介绍、项目介绍等具体方向提供更窄的 workflow

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

- **子技能优先（Subskill First）**：在开始创建任何 PPT 前，必须先查看 `subskills/` 目录下（或通过 `scripts/list_catalog.js`）是否已有为该场景定制的专属子技能。如果存在对应的子技能（如 `english-lesson`、`personal-intro`），**必须优先阅读并严格遵循该子技能 `SKILL.md` 中的专属规范与工作流**，绝不能用当前的通用兜底流程硬做。
- 不要让 AI 直接输出任意 HTML 页面作为最终真相来源
- 所有页面内容都必须落到 `deck.json` 的结构化组件模型里
- 预览与导出必须读取同一份 `deck.json`
- 默认优先保证可编辑性，复杂页面再考虑保真兜底
- 动画优先用结构化 `animation` 字段描述；HTML 预览真实播放，PPT 导出默认用 build slides 模拟

## 目录导航

- `references/slide-schema.md`
  定义 `deck.json` 的结构与当前支持的组件。
- `references/layout-rules.md`
  定义版式、字号、间距和溢出控制规则。
- `references/template-catalog.md`
  定义当前模板、archetype 和版式变体目录。
- `references/prompt-patterns.md`
  定义大纲生成、页面生成、编辑指令改写的提示词模式。
- `scripts/list_catalog.js`
  列出模板、archetype、版式变体和已存在的子 skill。
- `scripts/create_ppt_skill.js`
  根据新场景脚手架出新的 PPT 子 skill 和 archetype。**注：AI 执行此操作时，须遵循 `.agents/workflows/create-subskill.md` 中定义的交互访谈流程。**
- `scripts/validate_deck.js`
  校验 deck 数据是否合法。
- `scripts/init_project.js`
  为每个新 PPT 创建独立项目文件夹，并支持选择 template 和 archetype。
- `scripts/build_project.js`
  在项目目录里一键校验和预览。加 `--export` 导出 `.pptx`。
- `scripts/open_project_preview.js`
  为指定项目生成并打开 viewer 风格的 `preview.html`。加 `--export` 同时导出。
- `scripts/render_preview.js`
  生成简洁的 viewer 预览页面，左侧为页列表，右侧为自动缩放的 slide 展示。
- `scripts/export_ppt.js`
  单独导出 `.pptx`，文件名与项目目录名一致（如 `lesson-23-24.pptx`）。
- `scripts/list_materials.js`
  列出 `materials/` 目录下的参考素材文件。
- `scripts/apply_edit.js`
  根据结构化编辑指令更新 deck。
- `scripts/plan_edit.js`
  将自然语言修改命令翻译为结构化 operations。
- `scripts/edit_with_command.js`
  一步完成“自然语言指令 -> deck 修改”。
- `subskills/personal-intro`
  面向个人介绍类 PPT 的子 skill。
- `subskills/project-intro`
  面向项目介绍类 PPT 的子 skill。
- `subskills/english-lesson`
  面向英语课堂教学 PPT 的子 skill（10 分钟课堂结构）。
- `materials/`
  存放用户上传的参考素材（教材 PDF、文稿、图片等），AI 从中提取内容生成 PPT。

## 推荐工作流

1. **预检（关键！）**：如果用户要求做特定场景的 PPT，在创建之前，**必须先阅读 `subskills/` 目录或执行 `node scripts/list_catalog.js` 检查是否有现成的专属子技能**（例如用户要做英语备课，务必走 `english-lesson` 子技能的流程）。若存在，必须切换并遵守该子技能的 README 或规范进行交付！若不存在，才适用当前的兜底通用流程。
2. 先创建独立项目目录，路径位于 `projects/<slug>/`，并选择合适的 template / archetype。
3. 阅读 `references/slide-schema.md`，确认当前支持哪些页面和组件。
4. 如有参考素材，放入 `materials/` 目录。可用 `node scripts/list_materials.js` 查看。
5. 根据用户输入在该项目目录里生成 `deck.json`。
6. 运行 `node scripts/build_project.js projects/<slug>` 校验和预览。
7. 需要查看页面时，使用 `scripts/open_project_preview.js` 打开项目 viewer。
8. 根据用户反馈继续修改该项目目录里的 `deck.json`。
9. 用户确认后，加 `--export` 导出 `.pptx`（文件名与项目名一致）。
10. 后续所有预览、编辑和导出都在同一项目文件夹内完成。

## 命令示例

在本技能目录下运行：

```bash
npm install
npm run project:new
npm run validate
npm run preview
npm run export
npm run catalog
node scripts/list_materials.js
node scripts/build_project.js projects/lesson-23-24
node scripts/build_project.js projects/lesson-23-24 --export
node scripts/open_project_preview.js projects/lesson-23-24
node scripts/init_project.js openclaw-intro "OpenClaw 介绍"
node scripts/init_project.js founder-profile "创始人介绍" --template profile-editorial --archetype personal-intro
node scripts/create_ppt_skill.js customer-story "客户案例介绍" "适合客户案例复盘、售前演示和项目展示"
```

## deck 生成要求

- 每个 slide 必须有稳定的 `id`
- 每个 component 必须有稳定的 `id`
- deck 建议同时带上 `meta.template` 和 `meta.archetype`
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
- 右侧顶部精简工具栏：页码芯片 + 页面名称 + 导航按钮
- slide 画布自动缩放适配窗口大小（scale-to-fit）
- 悬停组件时显示 tooltip（名称 + 类型）
- 点击组件后自动复制识别信息，方便告诉 AI 修改”

## 模板与子 skill 约定

- `template` 负责视觉风格和推荐页型变体，不直接替代 theme
- `archetype` 负责某类 PPT 的默认起稿结构
- `subskills/` 里的子 skill 应该只保留对应场景的简洁 workflow，不复制主技能的大量通用说明
- 新建场景优先用 `scripts/create_ppt_skill.js`，同时生成一个新的 archetype 脚手架

## 动画说明

- 预览层支持 `fade-in`、`slide-up`、`zoom-in`
- 导出层默认不依赖 PowerPoint 原生对象动画
- 如组件设置了 `animation.build`，导出时会按 build 顺序展开成多张连续幻灯片
