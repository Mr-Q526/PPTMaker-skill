---
name: ppt-english-lesson
description: 面向英语课堂教学场景生成结构化课件，覆盖导入、课文讲解、词汇、句型、练习和总结等教学环节，并强调课堂节奏与投屏可读性。
---

# 英语课堂讲解

这个子 skill 用于英语课堂课件制作。目标不是生成一份普通展示文稿，而是做一份能直接拿去上课的教学型 PPT：节奏清晰、英文内容醒目、练习有互动，整套结构围绕一节课的教学流程展开。

## 何时使用

- 用户要做英语课堂教学 PPT
- 用户提供了教材 PDF 或课文内容，需要自动生成教学课件
- 用户指定了具体的 Lesson 编号和课堂时长
- 用户需要包含暖场导入、课文讲解、词汇练习、句型操练等教学环节

## 默认选择

- archetype：`english-lesson`
- template：优先 `business-briefing`
- 推荐页数：`6-8 页`

## 推荐起稿命令

```bash
node scripts/init_project.js lesson-23-24 "Lesson 23-24 Months & Holidays" --template business-briefing --archetype english-lesson
```

## 输入时优先补齐的信息

- 年级、教材版本、Lesson 编号、课堂时长
- 原始课文、词汇表、句型或练习题
- 本节课教学目标：学生学完后要会什么
- 是否需要中英双语、是否要布置作业

## 固定输出结构

1. 封面：课题、课时、年级
2. Warm-up：图片或问题导入
3. Text Learning：课文或核心对话
4. Key Vocabulary：新词、释义、例句
5. Key Sentences：句型结构和替换示例
6. Practice：课堂互动练习
7. Summary：回顾与作业

## 版式与组件规则

- 优先使用 `cover`、`image-text`、`title-bullets`、`table`、`comparison`、`quote`
- 英文关键词和句型必须比中文辅助信息更醒目
- 每页停留时间要合理，不能在一页堆完整课文解析
- 练习页优先给出题目和操作方式，避免只有答案
- 如果用户没有提供真实图片，可以保留图片占位，但必须优先保证教学内容完整

## 课堂展示约束

- 英文正文建议保持大字号，避免投屏看不清
- 中文解释只做辅助，不要抢主信息
- 句型页优先用大字 + 例句，不要写成语法长文
- 课堂总结页要回到教学目标，不能只写“Thank you”

## 从教材 PDF 到 PPT 的工作流

1. 提取教材 PDF 中指定 Lesson 的文本内容
2. 分析课文结构：阅读文本、词汇表、练习题
3. 按教学环节组织内容到 deck.json
4. 生成预览和导出
