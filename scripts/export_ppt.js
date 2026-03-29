const path = require("path");
const PptxGenJS = require("pptxgenjs");
const {
  cloneJson,
  getBuildStages,
  normalizeAnimation,
  readJson,
  resolveAssetPath,
  resolveTheme,
  toPptHex,
  ensureDir
} = require("./common");

function imageFitMode(component) {
  if (component.fit === "cover" || component.fit === "contain") {
    return component.fit;
  }

  if (component.role === "background" || (component.x === 0 && component.y === 0 && component.w >= 13 && component.h >= 7)) {
    return "cover";
  }

  return "contain";
}

function textOptions(component, theme, extra = {}) {
  const style = component.style || {};
  return {
    x: component.x,
    y: component.y,
    w: component.w,
    h: component.h,
    fontFace: style.fontFace || theme.fontFamilySans,
    fontSize: style.fontSize || 18,
    color: toPptHex(style.color, toPptHex(theme.textColor)),
    bold: Boolean(style.bold),
    align: style.textAlign || "left",
    margin: 0,
    breakLine: false,
    valign: "mid",
    ...extra
  };
}

function addBulletList(slide, component, theme) {
  const items = component.items.map((item) => ({
    text: item,
    options: {
      bullet: { indent: 16 }
    }
  }));

  slide.addText(items, textOptions(component, theme, { breakLine: true, valign: "top" }));
}

function addImage(slide, component, deckPath) {
  const imagePath = resolveAssetPath(component.src, deckPath);
  const fit = imageFitMode(component);
  slide.addImage({
    path: imagePath,
    x: component.x,
    y: component.y,
    w: component.w,
    h: component.h,
    sizing: {
      type: fit,
      w: component.w,
      h: component.h
    }
  });
}

function addDivider(slide, component, theme) {
  const style = component.style || {};
  const fillColor = style.backgroundColor || style.fill || style.color || null;
  slide.addShape("rect", {
    x: component.x,
    y: component.y,
    w: component.w,
    h: component.h,
    line: {
      color: toPptHex(fillColor, toPptHex(theme.dividerColor)),
      transparency: 100
    },
    fill: {
      color: toPptHex(fillColor, toPptHex(theme.dividerColor))
    }
  });
}

function addShape(slide, component, theme) {
  const style = component.style || {};
  const fillColor = style.backgroundColor || style.fill || null;
  const shapeType = component.shape === "circle" ? "ellipse" : component.shape === "roundedRect" ? "roundRect" : "rect";
  const opacityPercent = style.opacity !== undefined ? Math.round(style.opacity * 100) : 100;
  const transparency = 100 - opacityPercent;

  slide.addShape(shapeType, {
    x: component.x,
    y: component.y,
    w: component.w,
    h: component.h,
    line: {
      color: toPptHex(style.borderColor, toPptHex(theme.dividerColor)),
      pt: 1,
      transparency: transparency
    },
    fill: {
      color: toPptHex(fillColor, toPptHex(theme.surfaceColor)),
      transparency: transparency
    }
  });
}

function addTable(slide, component, theme) {
  slide.addTable(component.rows, {
    x: component.x,
    y: component.y,
    w: component.w,
    h: component.h,
    fontFace: theme.fontFamilySans,
    fontSize: (component.style || {}).fontSize || 12,
    color: toPptHex(theme.textColor),
    border: { type: "solid", color: toPptHex(theme.dividerColor), pt: 1 },
    fill: toPptHex(theme.surfaceColor)
  });
}

function mapChartType(kind) {
  switch (kind) {
    case "line":
      return "line";
    case "pie":
      return "pie";
    case "bar":
    default:
      return "bar";
  }
}

function addChart(slide, component, theme) {
  const chartData = component.series.map((series) => ({
    name: series.name,
    labels: component.categories,
    values: series.values
  }));

  slide.addChart(mapChartType(component.kind), chartData, {
    x: component.x,
    y: component.y,
    w: component.w,
    h: component.h,
    showLegend: true,
    showTitle: Boolean(component.text),
    title: component.text || undefined,
    catAxisLabelColor: toPptHex(theme.mutedTextColor),
    valAxisLabelColor: toPptHex(theme.mutedTextColor),
    chartColors: [toPptHex(theme.accentColor)]
  });
}

function addComponent(slide, component, deckPath, theme) {
  switch (component.type) {
    case "title":
      slide.addText(component.text, textOptions(component, theme, { fontFace: theme.fontFamilyDisplay, bold: true }));
      return;
    case "subtitle":
      slide.addText(component.text, textOptions(component, theme, { color: toPptHex(theme.mutedTextColor) }));
      return;
    case "text":
      slide.addText(component.text, textOptions(component, theme, { valign: "top" }));
      return;
    case "bullet-list":
      addBulletList(slide, component, theme);
      return;
    case "image":
      addImage(slide, component, deckPath);
      return;
    case "divider":
      addDivider(slide, component, theme);
      return;
    case "quote-block":
      slide.addText(component.text, textOptions(component, theme, { italic: true, valign: "top" }));
      return;
    case "shape":
      addShape(slide, component, theme);
      return;
    case "table":
      addTable(slide, component, theme);
      return;
    case "chart":
      addChart(slide, component, theme);
      return;
    default:
      throw new Error(`Unsupported component type for export: ${component.type}`);
  }
}

function expandSlideBuilds(deckSlide) {
  const components = deckSlide.components || [];
  const buildStages = getBuildStages(components);
  if (!buildStages.length) {
    return [
      {
        ...deckSlide,
        buildStage: null,
        buildCount: 0,
        components: cloneJson(components)
      }
    ];
  }

  const steps = [];
  const baseComponents = components.filter((component) => normalizeAnimation(component).build === 0);
  steps.push({
    ...deckSlide,
    buildStage: 0,
    buildCount: buildStages.length,
    components: cloneJson(baseComponents)
  });

  for (const stage of buildStages) {
    const visibleComponents = components.filter((component) => {
      const build = normalizeAnimation(component).build;
      return build === 0 || build <= stage;
    });

    steps.push({
      ...deckSlide,
      buildStage: stage,
      buildCount: buildStages.length,
      components: cloneJson(visibleComponents)
    });
  }

  return steps;
}

async function main() {
  const deckArg = process.argv[2];
  const outputArg = process.argv[3];
  if (!deckArg || !outputArg) {
    console.error("Usage: node scripts/export_ppt.js <deck.json> <output.pptx>");
    process.exit(1);
  }

  const deckPath = path.resolve(deckArg);
  const outputPath = path.resolve(outputArg);
  const deck = readJson(deckPath);
  const theme = resolveTheme(deck.meta.theme);
  ensureDir(path.dirname(outputPath));

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Codex PPT Maker";
  pptx.company = "OpenAI";
  pptx.subject = deck.meta.title;
  pptx.title = deck.meta.title;
  pptx.lang = "zh-CN";
  pptx.theme = {
    headFontFace: theme.fontFamilyDisplay,
    bodyFontFace: theme.fontFamilySans,
    lang: "zh-CN"
  };

  for (const deckSlide of deck.slides) {
    const buildStates = expandSlideBuilds(deckSlide);

    for (const buildState of buildStates) {
      const slide = pptx.addSlide();
      slide.background = { color: toPptHex(theme.backgroundColor) };

      for (const component of buildState.components || []) {
        addComponent(slide, component, deckPath, theme);
      }
    }
  }

  await pptx.writeFile({ fileName: outputPath });
  console.log(`PPT written to ${outputPath}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
