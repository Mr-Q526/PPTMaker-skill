# Template Catalog

当前系统把 PPT 生成拆成三层：

- `template`：视觉风格、默认主题、推荐版式组合
- `layoutVariant`：某一页型的具体版式变体
- `archetype`：某类 PPT 的默认大纲与起稿结构

## 当前 template

- `business-briefing`：商务汇报
- `launch-stage`：发布会风
- `profile-editorial`：人物杂志风

## 当前 archetype

- `general-briefing`：通用汇报
- `project-intro`：项目介绍
- `personal-intro`：个人介绍
- `customer-story`：客户案例介绍
- `english-lesson`：英语课堂讲解

## 当前子 skill

- `subskills/project-intro`
- `subskills/personal-intro`
- `subskills/customer-story`
- `subskills/english-lesson`

## 命令

列出所有目录：

```bash
node scripts/list_catalog.js
```

创建项目时指定：

```bash
node scripts/init_project.js founder-profile "创始人介绍" --template profile-editorial --archetype personal-intro
node scripts/init_project.js openclaw-intro "OpenClaw 介绍" --template launch-stage --archetype project-intro
```

创建新的场景化子 skill：

```bash
node scripts/create_ppt_skill.js customer-story "客户案例介绍" "适合客户案例复盘、售前演示和项目展示"
```
