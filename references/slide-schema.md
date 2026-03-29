# Slide Schema

`deck.json` 是整个系统的唯一事实来源。

## 顶层结构

```json
{
  "meta": {
    "title": "string",
    "theme": "business-clean",
    "template": "business-briefing",
    "archetype": "general-briefing",
    "ratio": "16:9",
    "mode": "editable"
  },
  "slides": []
}
```

## meta 字段

- `title`: 演示文稿标题
- `theme`: 主题名称，对应 `assets/themes/*.json`
- `template`: 模板名称，对应 `assets/templates/*.json`
- `archetype`: 内容脚手架名称，对应 `assets/archetypes/*.json`
- `ratio`: 当前固定为 `16:9`
- `mode`: 当前支持 `editable` 和 `fidelity`

## slide 结构

```json
{
  "id": "slide-01",
  "label": "封面",
  "layoutVariant": "hero-left",
  "type": "cover",
  "components": []
}
```

## 当前支持的 slide type

- `cover`
- `agenda`
- `section`
- `title-bullets`
- `two-column`
- `image-text`
- `comparison`
- `timeline`
- `table`
- `chart`
- `quote`

## layoutVariant 字段

- `layoutVariant` 用于声明当前页选用的版式变体
- 可选值来自 `assets/layouts/library.json`
- 当前主要用于起稿、模板推荐和后续自然语言重排版，不影响基础导出能力

## component 通用字段

每个组件都必须包含：

- `id`
- `type`
- `x`
- `y`
- `w`
- `h`

建议额外包含：

- `label`
- `role`
- `aliases`
- `animation`

坐标单位统一使用英寸，对齐 PowerPoint 宽屏布局。

## animation 字段

组件可选 `animation` 字段，用来描述预览动画与导出时的 build 次序。

```json
{
  "animation": {
    "effect": "slide-up",
    "build": 2,
    "durationMs": 640,
    "delayMs": 560
  }
}
```

- `effect`: 当前支持 `fade-in`、`slide-up`、`zoom-in`
- `build`: 出现批次，`1` 表示第一步出现，未填写表示默认常驻
- `durationMs`: 预览动画时长
- `delayMs`: 预览动画额外延迟

当前导出策略：

- HTML 预览会真实播放动画
- PPT 导出会按 `build` 自动展开成多张连续幻灯片，以模拟逐步出现
- 这比原生 PowerPoint 对象动画更稳，但会增加导出的总页数

## 当前支持的 component type

### `title`

```json
{
  "id": "s01-title",
  "label": "封面标题",
  "role": "title-primary",
  "aliases": ["主标题"],
  "type": "title",
  "text": "AI 产品介绍",
  "x": 0.9,
  "y": 0.9,
  "w": 8.5,
  "h": 0.7,
  "style": {
    "fontSize": 28,
    "bold": true,
    "color": "#0F172A"
  }
}
```

### `subtitle`

与 `title` 类似，通常字号更小、颜色更弱。

### `text`

普通正文文本框，适合段落说明。

### `bullet-list`

```json
{
  "id": "s02-bullets",
  "type": "bullet-list",
  "items": ["降本", "提效", "自动化"],
  "x": 0.9,
  "y": 1.8,
  "w": 5.0,
  "h": 2.8,
  "style": {
    "fontSize": 18,
    "color": "#111827"
  }
}
```

### `image`

```json
{
  "id": "s02-image",
  "type": "image",
  "src": "./assets/preview/placeholder-graphic.svg",
  "x": 7.9,
  "y": 1.4,
  "w": 4.0,
  "h": 3.6
}
```

### `divider`

细分隔条，用于强调层级。

### `quote-block`

强调型引用文本块。

### `shape`

当前支持：

- `rect`
- `roundedRect`
- `circle`

### `table`

```json
{
  "id": "s03-table",
  "type": "table",
  "rows": [
    ["指标", "Q1", "Q2"],
    ["收入", "18", "26"],
    ["利润", "5", "8"]
  ],
  "x": 0.9,
  "y": 1.7,
  "w": 6.8,
  "h": 3.2
}
```

### `chart`

当前为 MVP 简化格式：

```json
{
  "id": "s04-chart",
  "type": "chart",
  "kind": "bar",
  "text": "季度增长",
  "categories": ["Q1", "Q2", "Q3"],
  "series": [
    {
      "name": "收入",
      "values": [18, 26, 31]
    }
  ],
  "x": 0.9,
  "y": 1.7,
  "w": 6.5,
  "h": 3.5
}
```

## 组件生成约束

- 每个组件 id 必须稳定且可读
- 每个可编辑组件最好有 `label`，便于用户用自然语言点名
- 需要被频繁引用的组件应补 `aliases`
- 不要把多个语义不同的内容塞进同一个文本框
- 尽量让组件语义化，便于自然语言编辑定位
- 如果内容太长，应拆页而不是缩小到不可读
- `label`: 可读的页面名称，便于自然语言编辑时定位
