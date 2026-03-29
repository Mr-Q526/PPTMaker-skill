# PPT Maker Skill

一个面向 `Codex skill` 场景的结构化 PPT 生成器。

它的核心思路不是“任意 HTML 转 PPT”，而是：

`用户输入 -> 结构化 deck.json -> HTML 预览 -> 可编辑 PPTX 导出`

项目同时支持：

- 按项目文件夹管理每一套 PPT
- 模板（template）选择
- 场景脚手架（archetype）
- 面向不同场景的子技能（subskills）
- 自然语言修改页面与组件
- 预览页查看与导出

如果你是让 AI 来使用这个技能，请优先阅读 [SKILL.md](/Users/minruiqing/MyProjects/My%20skills/pptmaker-skill/SKILL.md)。  
`README.md` 更偏向人类开发者和维护者阅读。

## 当前能力

- 根据主题或文稿生成 `deck.json`
- 渲染 `preview.html`
- 导出 `.pptx`
- 按项目目录保存输出结果
- 支持模板、版式变体和 archetype
- 支持场景化 subskill
- 支持自然语言编辑指令到结构化 operation 的转换

## 核心概念

### 1. template

控制整体视觉风格和推荐版式组合。

当前内置：

- `business-briefing`
- `launch-stage`
- `profile-editorial`

### 2. archetype

控制某一类 PPT 的默认结构和 starter deck。

当前内置：

- `general-briefing`
- `project-intro`
- `personal-intro`
- `customer-story`
- `english-lesson`
- `club-recruiting`
- `course-presentation`
- `thesis-defense`

### 3. subskill

面向具体场景的更窄 workflow。  
例如：个人介绍、项目介绍、英语课堂讲解、毕业答辩。

### 4. project

每套 PPT 都放在独立目录里，通常位于 `projects/<slug>/`，包括：

- `deck.json`
- `brief.md`
- `preview.html`
- `<project-name>.pptx`

## 目录结构

```text
pptmaker-skill/
├── README.md
├── SKILL.md
├── package.json
├── agents/
├── assets/
│   ├── archetypes/
│   ├── layouts/
│   ├── preview/
│   └── templates/
├── materials/
├── projects/
├── references/
├── scripts/
└── subskills/
```

## 安装

需要本地 Node.js 环境。

```bash
cd "/Users/minruiqing/MyProjects/My skills/pptmaker-skill"
npm install
```

## 快速开始

### 查看当前可用模板 / archetype / subskill

```bash
npm run catalog
```

### 查看参考素材

```bash
node scripts/list_materials.js
```

### 创建一个新项目

```bash
node scripts/init_project.js openclaw-intro "OpenClaw 介绍" --template launch-stage --archetype project-intro
```

### 构建预览

```bash
node scripts/build_project.js projects/openclaw-intro
```

### 构建并导出 PPT

```bash
node scripts/build_project.js projects/openclaw-intro --export
```

导出文件默认保存在项目目录下，文件名为：

```text
projects/openclaw-intro/openclaw-intro.pptx
```

### 打开项目预览页

```bash
node scripts/open_project_preview.js projects/openclaw-intro
```

如果需要同时导出：

```bash
node scripts/open_project_preview.js projects/openclaw-intro --export
```

## 自然语言编辑

示例：

```bash
node scripts/edit_with_command.js \
  samples/example-deck.json \
  "把第二页右侧正文左移一点" \
  outputs/example-command-deck.json \
  outputs/example-command-plan.json
```

相关脚本：

- `scripts/plan_edit.js`
- `scripts/apply_edit.js`
- `scripts/edit_with_command.js`

## 当前内置 subskills

- `personal-intro`
- `project-intro`
- `customer-story`
- `english-lesson`
- `club-recruiting`
- `course-presentation`
- `thesis-defense`

这些子技能位于 [subskills](/Users/minruiqing/MyProjects/My%20skills/pptmaker-skill/subskills) 目录下，每个子技能都包含：

- `SKILL.md`
- `agents/openai.yaml`
- `references/outline.md`

## 创建新的 PPT 子技能

```bash
node scripts/create_ppt_skill.js customer-story "客户案例介绍" "适合客户案例复盘、售前演示和项目展示"
```

这个脚本会自动生成：

- 一个新的 `subskills/<slug>/`
- 一个新的 `assets/archetypes/<slug>.json`

## 常用脚本

`package.json` 中当前可直接使用的命令：

```bash
npm run validate
npm run preview
npm run export
npm run edit
npm run plan:command
npm run command
npm run project:new
npm run project:build
npm run project:open
npm run catalog
npm run skill:new
```

## 技术栈

- Node.js
- `PptxGenJS`
- `Ajv`
- 固定坐标 HTML 预览
- `deck.json` 结构化中间层

## 重要说明

### 1. 单一事实来源

预览和导出都必须基于同一份 `deck.json`。

### 2. subskill first

如果是明确场景的 PPT，优先使用对应 subskill，而不是直接套通用流程。

### 3. 动画边界

当前预览支持结构化动画字段。  
导出层默认仍以稳定性优先，不依赖 PowerPoint 原生对象动画。

### 4. README 与 SKILL 的区别

- `README.md`：给人看，帮助理解项目和维护方式
- `SKILL.md`：给 AI 用，定义实际工作流和行为规范

## 推荐阅读

- [SKILL.md](/Users/minruiqing/MyProjects/My%20skills/pptmaker-skill/SKILL.md)
- [references/slide-schema.md](/Users/minruiqing/MyProjects/My%20skills/pptmaker-skill/references/slide-schema.md)
- [references/template-catalog.md](/Users/minruiqing/MyProjects/My%20skills/pptmaker-skill/references/template-catalog.md)
- [scripts](/Users/minruiqing/MyProjects/My%20skills/pptmaker-skill/scripts)
- [subskills](/Users/minruiqing/MyProjects/My%20skills/pptmaker-skill/subskills)
