# Prompt Patterns

本文件用于指导 AI 如何生成大纲、页面和编辑操作。

## 1. 大纲生成

输入可能是：

- 一句话主题
- Markdown
- 一篇长文

输出应包含：

- 建议页数
- 每页目标
- 每页页面类型
- 每页要点

建议提示模式：

```text
你要把用户输入转成一个适合 6 到 10 页演示文稿的结构化大纲。
每页都要说明：
1. slide id
2. slide type
3. page goal
4. key points
5. suggested visual
避免空泛表达，优先保留信息密度与演示节奏。
```

## 2. 页面生成

建议提示模式：

```text
根据已经确定的大纲，把每一页生成成 deck.json 结构。
要求：
1. 所有组件必须有稳定 id
2. 所有组件必须有 x, y, w, h
3. 不要输出任意 HTML
4. 优先使用 title, subtitle, text, bullet-list, image, table, chart 等语义组件
5. 控制文本长度，避免溢出
```

## 3. 自然语言编辑

建议分两步：

### 第一步：理解用户意图

识别：

- 目标页
- 目标组件
- 修改类型
- 修改约束

### 第二步：输出结构化编辑操作

建议输出为：

```json
{
  "operations": [
    {
      "type": "replace-text",
      "componentId": "s03-title",
      "text": "增长飞轮"
    }
  ]
}
```

当前 `scripts/apply_edit.js` 支持：

- `replace-text`
- `set-style`
- `move-component`
- `nudge-component`
- `delete-component`
- `set-meta`
- `set-chart-kind`
- `apply-layout-preset`

## 4. 命令式自然语言编辑

现在支持一条更直接的工作流：

```bash
node scripts/edit_with_command.js <deck.json> "把第二页右侧正文左移一点" <output-deck.json> [output-plan.json]
```

当前命令解析器适合处理这些类型的指令：

- 改某页标题或正文文字
- 删除某个图片、表格或图表
- 把某个组件左移、右移、上移、下移
- 把某个组件放大、缩小、变宽、变窄、变高、变矮
- 把某一页改成左右两栏
- 切换主题，如深色商务风、暖色杂志风
- 把图表改成柱状图、折线图或饼图

当前阶段建议一条命令只聚焦一个主要目标组件或一个主要目标页面。

推荐的寻址方式：

- `第2页标题`
- `第三页表格`
- `封面配图`
- `第二页右侧正文`
- `右上角图片`

## 5. 编辑优先级

- 优先小改而不是重做整页
- 优先保留内容语义
- 优先保持布局稳定
- 只有当用户明确要求换版式时才大改布局
