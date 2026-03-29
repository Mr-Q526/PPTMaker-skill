---
name: ppt-english-lesson
description: 面向英语课堂教学讲解场景，生成包含课文导入、词汇讲解、句型操练、课堂互动和课堂总结的结构化教学 PPT。支持基于教材内容自动提取和组织教学环节。
---

# PPT English Lesson（英语课堂讲解）

这个子 skill 面向英语课堂教学场景，默认复用 `ppt-maker` 的结构化 deck、预览和导出流程。

## 何时使用

- 用户要做英语课堂教学 PPT
- 用户提供了教材 PDF 或课文内容，需要自动生成教学课件
- 用户指定了具体的 Lesson 编号和课堂时长
- 用户需要包含暖场导入、课文讲解、词汇练习、句型操练等教学环节

## 默认选择

- archetype：`english-lesson`
- template：优先 `business-briefing`（清晰商务风适合教学），也可选 `launch-stage`

## 推荐起稿命令

```bash
node scripts/init_project.js lesson-23-24 "Lesson 23-24 Months & Holidays" --template business-briefing --archetype english-lesson
```

## 教学 PPT 结构设计原则

### 10 分钟课堂建议分页

1. **封面页**（Cover）— 课题信息、年级、课时
2. **课堂导入**（Warm-up）— 趣味问题或图片引入话题
3. **课文讲解**（Text Learning）— 核心课文内容展示与翻译
4. **重点词汇**（Key Vocabulary）— 新单词、发音和释义
5. **重点句型**（Key Sentences）— 核心句型结构与例句
6. **课堂练习**（Practice）— 互动练习或小测验
7. **课堂总结**（Summary）— 本课要点回顾与作业布置

### 内容要求

- 每页内容要适合课堂投屏，字号不能太小
- 英文单词和句子要醒目突出
- 中文释义作为辅助，字号可略小
- 重点词汇用不同颜色或加粗标注
- 课堂练习要设计互动性
- 总时间控制在用户指定的课堂时长内

### 版式提示

- 封面页建议大标题 + 年级信息 + 装饰元素
- 词汇页建议用表格或两栏布局
- 句型页建议用大字居中展示核心句型
- 练习页可以用 bullet-list 做选择题或填空题

## 从教材 PDF 到 PPT 的工作流

1. 提取教材 PDF 中指定 Lesson 的文本内容
2. 分析课文结构：阅读文本、词汇表、练习题
3. 按教学环节组织内容到 deck.json
4. 生成预览和导出
