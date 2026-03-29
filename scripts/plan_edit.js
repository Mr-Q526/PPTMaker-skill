const path = require("path");
const { PPT_LAYOUT, readJson, writeText } = require("./common");

const TEXT_TYPES = new Set(["title", "subtitle", "text", "bullet-list", "quote-block"]);
const TYPE_PATTERNS = [
  { types: ["title"], patterns: ["标题", "title", "主标题"] },
  { types: ["subtitle"], patterns: ["副标题", "subtitle"] },
  { types: ["text"], patterns: ["正文", "文本", "文字框", "文本框", "段落"] },
  { types: ["bullet-list"], patterns: ["要点", "项目符号", "bullet", "列表"] },
  { types: ["image"], patterns: ["图片", "配图", "图像", "image"] },
  { types: ["table"], patterns: ["表格", "表"] },
  { types: ["chart"], patterns: ["图表", "柱状图", "折线图", "饼图", "chart"] },
  { types: ["shape"], patterns: ["卡片", "底板", "背景卡片", "色块"] },
  { types: ["quote-block"], patterns: ["引用", "引言", "quote"] },
  { types: ["divider"], patterns: ["分割线", "横线", "divider"] }
];

const THEME_ALIASES = [
  { patterns: ["深色商务风", "暗色商务风", "深色主题", "黑金"], theme: "executive-dark" },
  { patterns: ["暖色杂志风", "暖色主题", "杂志风"], theme: "editorial-warm" },
  { patterns: ["商务风", "蓝色商务风", "清爽商务风"], theme: "business-clean" }
];

function chineseDigitsToNumber(input) {
  if (/^\d+$/.test(input)) {
    return Number(input);
  }

  const map = {
    零: 0,
    一: 1,
    二: 2,
    两: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10
  };

  if (input === "十") {
    return 10;
  }
  if (input.length === 2 && input.startsWith("十")) {
    return 10 + map[input[1]];
  }
  if (input.length === 2 && input.endsWith("十")) {
    return map[input[0]] * 10;
  }
  if (input.length === 3 && input[1] === "十") {
    return map[input[0]] * 10 + map[input[2]];
  }
  if (input.length === 1 && input in map) {
    return map[input];
  }
  return null;
}

function normalizeInstruction(instruction) {
  return instruction.trim().replace(/[，。；]/g, " ").replace(/\s+/g, " ");
}

function inferSlide(deck, instruction) {
  if (/封面|标题页/.test(instruction)) {
    return { slide: deck.slides[0], slideIndex: 0, reason: "cover" };
  }

  if (/最后一页|末页/.test(instruction)) {
    const slideIndex = deck.slides.length - 1;
    return { slide: deck.slides[slideIndex], slideIndex, reason: "last-slide" };
  }

  const pageMatch = instruction.match(/第\s*([0-9零一二三四五六七八九十两]+)\s*页/);
  if (pageMatch) {
    const slideNumber = chineseDigitsToNumber(pageMatch[1]);
    const slideIndex = slideNumber - 1;
    if (slideIndex >= 0 && slideIndex < deck.slides.length) {
      return { slide: deck.slides[slideIndex], slideIndex, reason: "ordinal" };
    }
  }

  for (let index = 0; index < deck.slides.length; index += 1) {
    const slide = deck.slides[index];
    const searchable = [slide.label, slide.id]
      .concat(
        (slide.components || [])
          .filter((component) => component.type === "title" && typeof component.text === "string")
          .map((component) => component.text)
      )
      .filter(Boolean)
      .join(" ");
    if (searchable && instruction.includes(searchable)) {
      return { slide, slideIndex: index, reason: "title-or-label" };
    }
  }

  return null;
}

function inferComponentTypes(instruction) {
  for (const entry of TYPE_PATTERNS) {
    if (entry.patterns.some((pattern) => instruction.includes(pattern))) {
      return entry.types;
    }
  }
  if (/文字|文本/.test(instruction)) {
    return Array.from(TEXT_TYPES);
  }
  return null;
}

function inferPosition(instruction) {
  const rules = [
    { key: "top-right", patterns: ["右上", "右上角"] },
    { key: "top-left", patterns: ["左上", "左上角"] },
    { key: "bottom-right", patterns: ["右下", "右下角"] },
    { key: "bottom-left", patterns: ["左下", "左下角"] },
    { key: "right", patterns: ["右侧", "右边", "靠右"] },
    { key: "left", patterns: ["左侧", "左边", "靠左"] },
    { key: "top", patterns: ["上方", "顶部", "靠上"] },
    { key: "bottom", patterns: ["下方", "底部", "靠下"] }
  ];

  const match = rules.find((rule) => rule.patterns.some((pattern) => instruction.includes(pattern)));
  return match ? match.key : null;
}

function matchesPosition(component, position) {
  if (!position) {
    return true;
  }
  const centerX = component.x + component.w / 2;
  const centerY = component.y + component.h / 2;
  const midX = PPT_LAYOUT.width / 2;
  const midY = PPT_LAYOUT.height / 2;

  switch (position) {
    case "top-right":
      return centerX >= midX && centerY < midY;
    case "top-left":
      return centerX < midX && centerY < midY;
    case "bottom-right":
      return centerX >= midX && centerY >= midY;
    case "bottom-left":
      return centerX < midX && centerY >= midY;
    case "right":
      return centerX >= midX;
    case "left":
      return centerX < midX;
    case "top":
      return centerY < midY;
    case "bottom":
      return centerY >= midY;
    default:
      return true;
  }
}

function textPreview(component) {
  if (typeof component.text === "string" && component.text) {
    return component.text;
  }
  if (Array.isArray(component.items) && component.items.length > 0) {
    return component.items[0];
  }
  return component.label || component.id;
}

function componentScore(component, requestedTypes) {
  let score = 0;
  if (requestedTypes && requestedTypes.includes(component.type)) {
    score += 6;
  }
  if (component.label) {
    score += 2;
  }
  if (component.role) {
    score += 1;
  }
  if (component.type === "title") {
    score += 1;
  }
  return score;
}

function resolveComponent(deck, instruction) {
  const slideTarget = inferSlide(deck, instruction);
  const requestedTypes = inferComponentTypes(instruction);
  const position = inferPosition(instruction);
  const slide = slideTarget ? slideTarget.slide : null;
  const scope = slide ? slide.components || [] : deck.slides.flatMap((item) => item.components || []);

  let candidates = scope;
  if (requestedTypes) {
    candidates = candidates.filter((component) => requestedTypes.includes(component.type));
  }
  if (position) {
    candidates = candidates.filter((component) => matchesPosition(component, position));
  }

  if (!candidates.length && slide) {
    candidates = slide.components || [];
  }
  if (!candidates.length) {
    return null;
  }

  candidates.sort((a, b) => componentScore(b, requestedTypes) - componentScore(a, requestedTypes) || a.y - b.y || a.x - b.x);
  const component = candidates[0];
  const owningSlide = slide || deck.slides.find((item) => (item.components || []).some((candidate) => candidate.id === component.id));
  return {
    slide: owningSlide,
    component,
    slideIndex: deck.slides.findIndex((item) => item.id === owningSlide.id),
    reason: `${requestedTypes ? requestedTypes.join(",") : "fallback"}${position ? `+${position}` : ""}`
  };
}

function inferAmount(instruction) {
  if (/很多|明显|大幅|不少/.test(instruction)) {
    return 0.45;
  }
  if (/一点|一些|稍微|轻微/.test(instruction)) {
    return 0.18;
  }
  return 0.28;
}

function extractReplacementText(instruction) {
  const quoted = instruction.match(/[“"'「](.+?)[”"'」]/);
  if (quoted) {
    return quoted[1];
  }

  const simple = instruction.match(/(?:改成|改为|替换成|换成)\s*(.+)$/);
  if (!simple) {
    return null;
  }

  return simple[1]
    .replace(/^(更像|更加)?/, "")
    .trim();
}

function buildThemeOperation(instruction) {
  const entry = THEME_ALIASES.find((item) => item.patterns.some((pattern) => instruction.includes(pattern)));
  if (!entry) {
    return null;
  }
  return {
    type: "set-meta",
    key: "theme",
    value: entry.theme
  };
}

function buildLayoutOperation(deck, instruction) {
  if (!/左右两栏|左右结构|双栏|两列/.test(instruction)) {
    return null;
  }
  const slideTarget = inferSlide(deck, instruction);
  if (!slideTarget) {
    throw new Error("Layout edits currently require a slide reference, such as 第2页 or 封面.");
  }
  return {
    type: "apply-layout-preset",
    slideId: slideTarget.slide.id,
    preset: "two-column"
  };
}

function buildChartKindOperation(deck, instruction) {
  if (!/(改成|改为|换成|替换成).*(柱状图|折线图|饼图)/.test(instruction)) {
    return null;
  }
  const target = resolveComponent(deck, instruction);
  if (!target || target.component.type !== "chart") {
    return null;
  }

  let kind = "bar";
  if (instruction.includes("折线图")) {
    kind = "line";
  } else if (instruction.includes("饼图")) {
    kind = "pie";
  }

  return {
    type: "set-chart-kind",
    componentId: target.component.id,
    kind
  };
}

function buildDeleteOperation(deck, instruction) {
  if (!/(删除|删掉|去掉)/.test(instruction)) {
    return null;
  }
  const target = resolveComponent(deck, instruction);
  if (!target) {
    throw new Error("Could not locate a component to delete.");
  }
  return {
    type: "delete-component",
    componentId: target.component.id
  };
}

function buildTextOperation(deck, instruction) {
  if (!/(改成|改为|替换成|换成)/.test(instruction)) {
    return null;
  }
  const requestedTypes = inferComponentTypes(instruction);
  if (!requestedTypes || !requestedTypes.some((type) => TEXT_TYPES.has(type))) {
    return null;
  }
  const target = resolveComponent(deck, instruction);
  if (!target || !TEXT_TYPES.has(target.component.type)) {
    return null;
  }
  const text = extractReplacementText(instruction);
  if (!text) {
    return null;
  }
  return {
    type: "replace-text",
    componentId: target.component.id,
    text
  };
}

function buildMoveOrResizeOperation(deck, instruction) {
  const target = resolveComponent(deck, instruction);
  if (!target) {
    return null;
  }

  const amount = inferAmount(instruction);
  let dx = 0;
  let dy = 0;
  let dw = 0;
  let dh = 0;

  if (/左移|往左|向左/.test(instruction)) {
    dx -= amount;
  }
  if (/右移|往右|向右/.test(instruction)) {
    dx += amount;
  }
  if (/上移|往上|向上/.test(instruction)) {
    dy -= amount;
  }
  if (/下移|往下|向下/.test(instruction)) {
    dy += amount;
  }
  if (/放大|变大/.test(instruction)) {
    dx -= amount / 2;
    dy -= amount / 2;
    dw += amount;
    dh += amount;
  }
  if (/缩小|变小/.test(instruction)) {
    dx += amount / 2;
    dy += amount / 2;
    dw -= amount;
    dh -= amount;
  }
  if (/变宽|拉宽/.test(instruction)) {
    dx -= amount / 2;
    dw += amount;
  }
  if (/变窄|收窄/.test(instruction)) {
    dx += amount / 2;
    dw -= amount;
  }
  if (/变高|拉高/.test(instruction)) {
    dy -= amount / 2;
    dh += amount;
  }
  if (/变矮|降低高度/.test(instruction)) {
    dy += amount / 2;
    dh -= amount;
  }

  if (!dx && !dy && !dw && !dh) {
    return null;
  }

  return {
    type: "nudge-component",
    componentId: target.component.id,
    dx,
    dy,
    dw,
    dh
  };
}

function planOperations(deck, rawInstruction) {
  const instruction = normalizeInstruction(rawInstruction);
  const operations = [];

  const themeOperation = buildThemeOperation(instruction);
  if (themeOperation) {
    operations.push(themeOperation);
  }

  const layoutOperation = buildLayoutOperation(deck, instruction);
  if (layoutOperation) {
    operations.push(layoutOperation);
  }

  const deleteOperation = buildDeleteOperation(deck, instruction);
  if (deleteOperation) {
    operations.push(deleteOperation);
  }

  const chartOperation = buildChartKindOperation(deck, instruction);
  if (chartOperation) {
    operations.push(chartOperation);
  }

  const textOperation = buildTextOperation(deck, instruction);
  if (textOperation) {
    operations.push(textOperation);
  }

  const moveOrResizeOperation = buildMoveOrResizeOperation(deck, instruction);
  if (moveOrResizeOperation) {
    operations.push(moveOrResizeOperation);
  }

  if (!operations.length) {
    throw new Error(`Could not map instruction to operations: ${rawInstruction}`);
  }

  const target = resolveComponent(deck, instruction);
  return {
    sourceInstruction: rawInstruction,
    resolvedTarget: target
      ? {
          slideId: target.slide.id,
          slideIndex: target.slideIndex + 1,
          componentId: target.component.id,
          componentType: target.component.type,
          componentPreview: textPreview(target.component),
          reason: target.reason
        }
      : null,
    operations
  };
}

function main() {
  const deckArg = process.argv[2];
  const instructionArg = process.argv[3];
  const outputArg = process.argv[4];
  if (!deckArg || !instructionArg) {
    console.error("Usage: node scripts/plan_edit.js <deck.json> <instruction> [output.json]");
    process.exit(1);
  }

  const deck = readJson(path.resolve(deckArg));
  const plan = planOperations(deck, instructionArg);
  const payload = `${JSON.stringify(plan, null, 2)}\n`;

  if (outputArg) {
    writeText(path.resolve(outputArg), payload);
    console.log(`Edit plan written to ${path.resolve(outputArg)}`);
    return;
  }

  process.stdout.write(payload);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  planOperations
};
