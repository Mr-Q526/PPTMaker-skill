const path = require("path");
const { pathToFileURL } = require("url");
const {
  PREVIEW_HEIGHT,
  PREVIEW_WIDTH,
  componentBoxStyle,
  escapeHtml,
  getBuildStages,
  loadBaseCss,
  normalizeAnimation,
  readJson,
  resolveAssetPath,
  resolveTheme,
  writeText
} = require("./common");

const SLIDE_TYPE_LABELS = {
  cover: "封面",
  agenda: "目录",
  section: "章节",
  "title-bullets": "标题与要点",
  "two-column": "双栏页",
  "image-text": "图文页",
  comparison: "对比页",
  timeline: "时间线",
  table: "表格页",
  chart: "图表页",
  quote: "引用页"
};

const COMPONENT_TYPE_LABELS = {
  title: "标题",
  subtitle: "副标题",
  text: "正文",
  "bullet-list": "要点列表",
  image: "图片",
  divider: "分隔线",
  "quote-block": "引用",
  table: "表格",
  chart: "图表",
  shape: "形状"
};

const ANIMATION_EFFECT_LABELS = {
  "fade-in": "淡入",
  "slide-up": "上移出现",
  "zoom-in": "缩放出现"
};

function displaySlideType(type) {
  return SLIDE_TYPE_LABELS[type] || type;
}

function displayComponentType(type) {
  return COMPONENT_TYPE_LABELS[type] || type;
}

function displayAnimationEffect(effect) {
  return ANIMATION_EFFECT_LABELS[effect] || effect || "无";
}

function imageFitMode(component) {
  if (component.fit === "cover" || component.fit === "contain") {
    return component.fit;
  }

  if (component.role === "background" || (component.x === 0 && component.y === 0 && component.w >= 13 && component.h >= 7)) {
    return "cover";
  }

  return "contain";
}

function summarizeComponent(component) {
  if (typeof component.text === "string" && component.text.trim()) {
    return component.text.trim().replace(/\s+/g, " ").slice(0, 120);
  }

  if (Array.isArray(component.items) && component.items.length > 0) {
    return component.items.join(" / ").slice(0, 120);
  }

  if (Array.isArray(component.rows) && component.rows.length > 0) {
    return `表格 · ${component.rows.length} 行`;
  }

  if (component.type === "image" && component.src) {
    return path.basename(component.src);
  }

  if (component.type === "chart") {
    return `图表 · ${(component.categories || []).length} 项`;
  }

  return component.label || component.role || component.id;
}

function joinStyles(tokens) {
  return tokens.filter(Boolean).join(";");
}

function dataAttributes(attributes) {
  return Object.entries(attributes)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `data-${key}="${escapeHtml(String(value))}"`)
    .join(" ");
}

function componentPresentation(component, slide, slideIndex, scope) {
  const animation = normalizeAnimation(component);
  const inspectable = scope === "stage" && component.role !== "background";
  const metadataAttributes = dataAttributes({
    "component-id": component.id,
    "component-label": component.label || "",
    "component-role": component.role || "",
    "component-type": component.type,
    "component-type-label": displayComponentType(component.type),
    "component-preview": summarizeComponent(component),
    "component-aliases": Array.isArray(component.aliases) ? component.aliases.join(", ") : "",
    "component-slide-id": slide.id,
    "component-slide-label": slide.label || displaySlideType(slide.type),
    "component-slide-type": slide.type,
    "component-slide-type-label": displaySlideType(slide.type),
    "component-slide-number": slideIndex + 1,
    "component-build": animation.build || "",
    "component-effect": animation.effect || "",
    "component-effect-label": displayAnimationEffect(animation.effect),
    "component-frame": `左 ${component.x.toFixed(2)} · 上 ${component.y.toFixed(2)} · 宽 ${component.w.toFixed(2)} · 高 ${component.h.toFixed(2)}`
  });

  return {
    attrs: metadataAttributes,
    animationAttr: "",
    animationClass: "",
    interactivityClass: inspectable ? " is-inspectable" : " is-passive",
    interactivityAttr: inspectable ? ' tabindex="0"' : ' data-noninteractive="true" aria-hidden="true"',
    styleTokens: []
  };
}

function renderTextComponent(component, className, slide, slideIndex, scope) {
  const style = component.style || {};
  const presentation = componentPresentation(component, slide, slideIndex, scope);
  const styles = joinStyles([
    componentBoxStyle(component),
    style.color ? `color:${style.color}` : "",
    style.fontSize ? `font-size:${style.fontSize}px` : "",
    style.fontFace ? `font-family:${style.fontFace}` : "",
    style.bold ? "font-weight:700" : "",
    style.fontWeight ? `font-weight:${style.fontWeight}` : "",
    style.textAlign ? `text-align:${style.textAlign}` : "",
    style.lineHeight ? `line-height:${style.lineHeight}` : "",
    ...presentation.styleTokens
  ]);

  return `<div class="component ${className}${presentation.animationClass}${presentation.interactivityClass}" ${presentation.attrs}${presentation.animationAttr}${presentation.interactivityAttr} style="${styles}">${escapeHtml(component.text)}</div>`;
}

function renderBulletList(component, slide, slideIndex, scope) {
  const style = component.style || {};
  const presentation = componentPresentation(component, slide, slideIndex, scope);
  const styles = joinStyles([
    componentBoxStyle(component),
    style.color ? `color:${style.color}` : "",
    style.fontSize ? `font-size:${style.fontSize}px` : "",
    style.fontFace ? `font-family:${style.fontFace}` : "",
    style.bold ? "font-weight:700" : "",
    style.lineHeight ? `line-height:${style.lineHeight}` : "",
    ...presentation.styleTokens
  ]);

  const items = component.items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  return `<div class="component bullet-list${presentation.animationClass}${presentation.interactivityClass}" ${presentation.attrs}${presentation.animationAttr}${presentation.interactivityAttr} style="${styles}"><ul>${items}</ul></div>`;
}

function renderDivider(component, slide, slideIndex, scope) {
  const style = component.style || {};
  const bgColor = style.backgroundColor || style.fill || style.color || "";
  const presentation = componentPresentation(component, slide, slideIndex, scope);
  const styles = joinStyles([
    componentBoxStyle(component),
    bgColor ? `background:${bgColor}` : "",
    "border-radius:999px",
    ...presentation.styleTokens
  ]);

  return `<div class="component divider${presentation.animationClass}${presentation.interactivityClass}" ${presentation.attrs}${presentation.animationAttr}${presentation.interactivityAttr} style="${styles}"></div>`;
}

function renderImage(component, slide, slideIndex, deckPath, scope) {
  const absolutePath = resolveAssetPath(component.src, deckPath);
  const imageSource = absolutePath ? `file://${absolutePath}` : "";
  const presentation = componentPresentation(component, slide, slideIndex, scope);
  const styles = joinStyles([componentBoxStyle(component), `object-fit:${imageFitMode(component)}`, ...presentation.styleTokens]);
  return `<img class="component image${presentation.animationClass}${presentation.interactivityClass}" ${presentation.attrs}${presentation.animationAttr}${presentation.interactivityAttr} src="${imageSource}" style="${styles}" alt="${escapeHtml(component.label || component.id)}" />`;
}

function renderQuote(component, slide, slideIndex, scope) {
  const style = component.style || {};
  const presentation = componentPresentation(component, slide, slideIndex, scope);
  const styles = joinStyles([
    componentBoxStyle(component),
    style.color ? `color:${style.color}` : "",
    style.fontSize ? `font-size:${style.fontSize}px` : "",
    style.fontFace ? `font-family:${style.fontFace}` : "",
    ...presentation.styleTokens
  ]);

  return `<blockquote class="component quote-block${presentation.animationClass}${presentation.interactivityClass}" ${presentation.attrs}${presentation.animationAttr}${presentation.interactivityAttr} style="${styles}">${escapeHtml(component.text)}</blockquote>`;
}

function renderShape(component, slide, slideIndex, scope) {
  const style = component.style || {};
  const bgColor = style.backgroundColor || style.fill || "";
  const opacityPercent = style.opacity !== undefined ? Math.round(style.opacity * 100) : 100;
  const presentation = componentPresentation(component, slide, slideIndex, scope);
  
  const backgroundStyle = bgColor ? `background:color-mix(in srgb, ${bgColor} ${opacityPercent}%, transparent)` : "";
  const borderStyle = style.borderColor ? `border:1px solid color-mix(in srgb, ${style.borderColor} ${opacityPercent}%, transparent)` : "";
  const borderRadius = component.shape === "circle" ? "border-radius:50%" : component.shape === "roundedRect" ? "border-radius:18px" : "";

  const styles = joinStyles([
    componentBoxStyle(component),
    backgroundStyle,
    borderStyle,
    borderRadius,
    ...presentation.styleTokens
  ]);

  return `<div class="component shape${presentation.animationClass}${presentation.interactivityClass}" ${presentation.attrs}${presentation.animationAttr}${presentation.interactivityAttr} style="${styles}"></div>`;
}

function renderTable(component, slide, slideIndex, scope) {
  const presentation = componentPresentation(component, slide, slideIndex, scope);
  const rows = component.rows
    .map((row, rowIndex) => {
      const cells = row
        .map((cell) => {
          const tag = rowIndex === 0 ? "th" : "td";
          return `<${tag}>${escapeHtml(cell)}</${tag}>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const styles = joinStyles([componentBoxStyle(component), ...presentation.styleTokens]);
  return `<div class="component table${presentation.animationClass}${presentation.interactivityClass}" ${presentation.attrs}${presentation.animationAttr}${presentation.interactivityAttr} style="${styles}"><table>${rows}</table></div>`;
}

function renderChart(component, slide, slideIndex, theme, scope) {
  const presentation = componentPresentation(component, slide, slideIndex, scope);
  const firstSeries = component.series[0] || { values: [] };
  const maxValue = Math.max(...firstSeries.values, 1);
  const bars = component.categories
    .map((label, index) => {
      const value = firstSeries.values[index] || 0;
      const barHeight = `${Math.max((value / maxValue) * 100, 4)}%`;
      return `
        <div class="chart-bar-group">
          <div class="chart-bar" style="height:${barHeight};background:${theme.accentColor};"></div>
          <div class="chart-label">${escapeHtml(label)}</div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="component chart${presentation.animationClass}${presentation.interactivityClass}" ${presentation.attrs}${presentation.animationAttr}${presentation.interactivityAttr} style="${joinStyles([componentBoxStyle(component), ...presentation.styleTokens])}">
      <div class="chart-title">${escapeHtml(component.text || firstSeries.name || "图表")}</div>
      <div class="chart-bars">${bars}</div>
    </div>
  `;
}

function renderComponent(component, slide, slideIndex, deckPath, theme, scope = "stage") {
  switch (component.type) {
    case "title":
      return renderTextComponent(component, "title", slide, slideIndex, scope);
    case "subtitle":
      return renderTextComponent(component, "subtitle", slide, slideIndex, scope);
    case "text":
      return renderTextComponent(component, "text", slide, slideIndex, scope);
    case "bullet-list":
      return renderBulletList(component, slide, slideIndex, scope);
    case "divider":
      return renderDivider(component, slide, slideIndex, scope);
    case "image":
      return renderImage(component, slide, slideIndex, deckPath, scope);
    case "quote-block":
      return renderQuote(component, slide, slideIndex, scope);
    case "shape":
      return renderShape(component, slide, slideIndex, scope);
    case "table":
      return renderTable(component, slide, slideIndex, scope);
    case "chart":
      return renderChart(component, slide, slideIndex, theme, scope);
    default:
      return `<div class="component unsupported" style="${componentBoxStyle(component)}">Unsupported: ${escapeHtml(component.type)}</div>`;
  }
}

function renderSlideCanvas(slide, slideIndex, deckPath, theme, scope = "stage") {
  const components = (slide.components || [])
    .map((component) => renderComponent(component, slide, slideIndex, deckPath, theme, scope))
    .join("\n");

  return `<div class="slide-canvas slide-canvas--${scope}">${components}</div>`;
}

function renderThumbnail(slide, slideIndex, deckPath, theme) {
  const thumbnailCanvas = renderSlideCanvas(slide, slideIndex, deckPath, theme, "thumb");

  return `
    <button class="slide-nav-item${slideIndex === 0 ? " is-active" : ""}" type="button" data-slide-index="${slideIndex}">
      <div class="slide-nav-meta">
        <div class="slide-nav-number">${slideIndex + 1}</div>
        <div class="slide-nav-copy">
          <strong>${escapeHtml(slide.label || displaySlideType(slide.type))}</strong>
          <span>${escapeHtml(displaySlideType(slide.type))}</span>
        </div>
      </div>
      <div class="slide-nav-thumb">
        <div class="slide-nav-thumb-scale">
          <section class="slide slide--thumbnail" aria-hidden="true">
            ${thumbnailCanvas}
          </section>
        </div>
      </div>
    </button>
  `;
}

function renderStageSlide(slide, slideIndex, deckPath, theme) {
  const buildStages = getBuildStages(slide.components || []);
  const hasAnimation = (slide.components || []).some((component) => Boolean(normalizeAnimation(component).effect));
  const componentCount = (slide.components || []).length;
  const stageCanvas = renderSlideCanvas(slide, slideIndex, deckPath, theme, "stage");

  return `
    <section
      class="stage-slide${slideIndex === 0 ? " is-active" : ""}"
      data-slide-index="${slideIndex}"
      data-slide-id="${escapeHtml(slide.id)}"
      data-slide-label="${escapeHtml(slide.label || displaySlideType(slide.type))}"
      data-slide-type="${escapeHtml(slide.type)}"
      data-slide-type-label="${escapeHtml(displaySlideType(slide.type))}"
      data-slide-build-count="${buildStages.length}"
      data-slide-build-seq="${buildStages.join(",")}"
      data-slide-component-count="${componentCount}"
    >
      <section class="slide" id="preview-${escapeHtml(slide.id)}" data-slide-id="${escapeHtml(slide.id)}" data-has-animation="${hasAnimation ? "true" : "false"}">
        ${stageCanvas}
      </section>
    </section>
  `;
}

function main() {
  const deckArg = process.argv[2];
  const outputArg = process.argv[3];
  if (!deckArg || !outputArg) {
    console.error("Usage: node scripts/render_preview.js <deck.json> <output.html>");
    process.exit(1);
  }

  const deckPath = path.resolve(deckArg);
  const outputPath = path.resolve(outputArg);
  const projectDir = path.dirname(deckPath);
  const projectSlug = path.basename(projectDir);
  const outputPptPath = path.join(projectDir, `${projectSlug}.pptx`);
  const outputPptHref = pathToFileURL(outputPptPath).href;
  const deck = readJson(deckPath);
  const theme = resolveTheme(deck.meta.theme);
  const css = loadBaseCss();
  const thumbnails = deck.slides
    .map((slide, slideIndex) => renderThumbnail(slide, slideIndex, deckPath, theme))
    .join("\n");
  const stageSlides = deck.slides
    .map((slide, slideIndex) => renderStageSlide(slide, slideIndex, deckPath, theme))
    .join("\n");

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(deck.meta.title)} 预览</title>
  <style>
${css}
  :root {
    --deck-width: ${PREVIEW_WIDTH}px;
    --deck-height: ${PREVIEW_HEIGHT}px;
    --thumb-scale: 0.18;
    --font-family-sans: ${theme.fontFamilySans};
    --font-family-display: ${theme.fontFamilyDisplay};
    --color-background: ${theme.backgroundColor};
    --color-surface: ${theme.surfaceColor};
    --color-text: ${theme.textColor};
    --color-muted: ${theme.mutedTextColor};
    --color-accent: ${theme.accentColor};
    --color-divider: ${theme.dividerColor};
  }
  </style>
</head>
<body>
  <main class="viewer-app">
    <aside class="viewer-sidebar">
      <div class="viewer-brand">
        <p class="viewer-kicker">项目预览</p>
        <h1>${escapeHtml(deck.meta.title)}</h1>
        <p class="viewer-subtitle">${escapeHtml(projectSlug)} · 共 ${deck.slides.length} 页</p>
        <p class="viewer-project-note">点击页面区块后，会自动复制可用于告诉 AI 的识别信息。</p>
      </div>
      <nav class="slide-nav" aria-label="幻灯片列表">
        ${thumbnails}
      </nav>
    </aside>

    <section class="viewer-main">
      <header class="viewer-toolbar">
        <div class="viewer-toolbar-left">
          <span class="viewer-page-chip" id="currentPageChip">第 1 / ${deck.slides.length} 页</span>
          <span class="viewer-slide-name" id="currentSlideTitle">${escapeHtml(deck.slides[0].label || displaySlideType(deck.slides[0].type))}</span>
        </div>
        <div class="viewer-toolbar-actions">
          <button type="button" class="viewer-action" id="prevSlideButton">◀</button>
          <button type="button" class="viewer-action" id="nextSlideButton">▶</button>
          <button type="button" class="viewer-action" id="replayButton">↻</button>
          <a class="viewer-action viewer-action--primary" href="${escapeHtml(outputPptHref)}">导出 PPT</a>
        </div>
      </header>

      <section class="viewer-stage-wrap">
        <div class="viewer-stage-frame" id="stageFrame">
          ${stageSlides}
        </div>
      </section>
    </section>
  </main>

  <div class="component-tooltip" id="componentTooltip" hidden></div>
  <div class="copy-toast" id="copyToast" hidden>已复制</div>

  <script>
    (() => {
      const stageSlides = Array.from(document.querySelectorAll(".stage-slide"));
      const navItems = Array.from(document.querySelectorAll(".slide-nav-item"));
      const prevButton = document.getElementById("prevSlideButton");
      const nextButton = document.getElementById("nextSlideButton");
      const replayButton = document.getElementById("replayButton");
      const currentPageChip = document.getElementById("currentPageChip");
      const currentSlideTitle = document.getElementById("currentSlideTitle");
      const stageFrame = document.getElementById("stageFrame");
      const tooltip = document.getElementById("componentTooltip");
      const copyToast = document.getElementById("copyToast");

      let activeIndex = 0;
      let hoveredElement = null;
      let pinnedElement = null;
      let copyToastTimer = null;
      let replayRunToken = 0;

      function buildSequenceForStage(stageElement) {
        if (!stageElement || !stageElement.dataset.slideBuildSeq) {
          return [];
        }
        return stageElement.dataset.slideBuildSeq
          .split(",")
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value > 0);
      }

      function applyBuildState(slideElement, activeBuildValue) {
        if (!slideElement) {
          return;
        }
        slideElement.querySelectorAll(".component").forEach((element) => {
          const build = Number(element.dataset.componentBuild || 0);
          const isHidden = build > 0 && build > activeBuildValue;
          element.classList.toggle("is-build-hidden", isHidden);
        });
      }

      function activeStageSlide() {
        return stageSlides[activeIndex] || null;
      }

      function activeCanvas() {
        const active = activeStageSlide();
        return active ? active.querySelector(".slide") : null;
      }

      function pageLabelFromData(data) {
        return "第" + data.componentSlideNumber + "页 · " + data.componentSlideLabel;
      }

      function promptSuggestion(data) {
        const targetName = data.componentLabel || data.componentRole || data.componentId;
        return "把" + pageLabelFromData(data) + "里的“" + targetName + "”（" + data.componentId + "）调整一下";
      }

      function buildRecognitionText(data) {
        return pageLabelFromData(data) + "中的“" + (data.componentLabel || data.componentId) + "”（" + data.componentId + "）";
      }

      async function copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          return;
        }

        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      function showCopyToast(message) {
        copyToast.textContent = message;
        copyToast.hidden = false;
        copyToast.classList.add("is-visible");
        window.clearTimeout(copyToastTimer);
        copyToastTimer = window.setTimeout(() => {
          copyToast.classList.remove("is-visible");
          copyToast.hidden = true;
        }, 1800);
      }

      function showTooltip(event, element) {
        const data = element.dataset;
        tooltip.hidden = false;
        tooltip.innerHTML =
          "<strong>" +
          (data.componentLabel || data.componentId) +
          "</strong><span>" +
          (data.componentTypeLabel || data.componentType) +
          (data.componentRole ? " · " + data.componentRole : "") +
          "</span>";
        const offset = 16;
        tooltip.style.left = event.clientX + offset + "px";
        tooltip.style.top = event.clientY + offset + "px";
      }

      function hideTooltip() {
        tooltip.hidden = true;
      }

      function refreshInspector() {}

      function clearComponentState() {
        if (hoveredElement) {
          hoveredElement.classList.remove("is-hovered");
          hoveredElement = null;
        }
        if (pinnedElement) {
          pinnedElement.classList.remove("is-selected");
          pinnedElement = null;
        }
        hideTooltip();
        refreshInspector();
      }

      function updateSlideInfo() {
        const stage = activeStageSlide();
        if (!stage) {
          return;
        }

        const page = activeIndex + 1;
        currentPageChip.textContent = "第 " + page + " / " + stageSlides.length + " 页";
        currentSlideTitle.textContent = stage.dataset.slideLabel;
        prevButton.disabled = activeIndex === 0;
        nextButton.disabled = activeIndex === stageSlides.length - 1;
      }

      function scaleStage() {
        const frame = stageFrame;
        if (!frame) return;
        const activeSlide = frame.querySelector(".stage-slide.is-active .slide");
        if (!activeSlide) return;
        const availW = frame.clientWidth - 44;
        const availH = frame.clientHeight - 44;
        const slideW = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--deck-width"));
        const slideH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--deck-height"));
        const scale = Math.min(availW / slideW, availH / slideH, 1);
        activeSlide.style.transform = "scale(" + scale + ")";
        activeSlide.style.transformOrigin = "top center";
      }

      function showFinalBuildState() {
        const stage = activeStageSlide();
        const canvas = activeCanvas();
        const sequence = buildSequenceForStage(stage);
        const finalBuild = sequence.length ? sequence[sequence.length - 1] : Number.POSITIVE_INFINITY;
        applyBuildState(canvas, finalBuild);
      }

      function replayCurrentBuildSequence(manual = false) {
        const stage = activeStageSlide();
        const canvas = activeCanvas();
        const sequence = buildSequenceForStage(stage);
        replayRunToken += 1;
        const currentRun = replayRunToken;

        if (!sequence.length) {
          applyBuildState(canvas, Number.POSITIVE_INFINITY);
          if (manual) {
            showCopyToast("当前页没有分步动画");
          }
          return;
        }

        applyBuildState(canvas, 0);
        sequence.forEach((buildValue, index) => {
          window.setTimeout(() => {
            if (currentRun !== replayRunToken) {
              return;
            }
            applyBuildState(canvas, buildValue);
          }, (index + 1) * 560);
        });
      }

      function setActiveSlide(index, options = {}) {
        const nextIndex = Math.max(0, Math.min(index, stageSlides.length - 1));
        replayRunToken += 1;
        activeIndex = nextIndex;
        stageSlides.forEach((stage, stageIndex) => {
          stage.classList.toggle("is-active", stageIndex === nextIndex);
        });
        navItems.forEach((item, itemIndex) => {
          item.classList.toggle("is-active", itemIndex === nextIndex);
          if (itemIndex === nextIndex) {
            item.scrollIntoView({ block: "nearest", behavior: options.instant ? "auto" : "smooth" });
          }
        });
        clearComponentState();
        updateSlideInfo();
        scaleStage();
        requestAnimationFrame(() => {
          if (options.replay === false) {
            showFinalBuildState();
            return;
          }
          replayCurrentBuildSequence(false);
        });
      }

      function attachComponentInteractions() {
        document.querySelectorAll(".stage-slide .component.is-inspectable").forEach((element) => {
          element.addEventListener("mouseenter", (event) => {
            if (hoveredElement && hoveredElement !== element) {
              hoveredElement.classList.remove("is-hovered");
            }
            hoveredElement = element;
            element.classList.add("is-hovered");
            refreshInspector();
            showTooltip(event, element);
          });

          element.addEventListener("mousemove", (event) => {
            if (element === hoveredElement) {
              showTooltip(event, element);
            }
          });

          element.addEventListener("mouseleave", () => {
            if (hoveredElement === element) {
              element.classList.remove("is-hovered");
              hoveredElement = null;
              hideTooltip();
              refreshInspector();
            }
          });

          element.addEventListener("focus", () => {
            if (hoveredElement && hoveredElement !== element) {
              hoveredElement.classList.remove("is-hovered");
            }
            hoveredElement = element;
            element.classList.add("is-hovered");
            refreshInspector();
          });

          element.addEventListener("blur", () => {
            if (hoveredElement === element) {
              element.classList.remove("is-hovered");
              hoveredElement = null;
              refreshInspector();
            }
          });

          element.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (pinnedElement && pinnedElement !== element) {
              pinnedElement.classList.remove("is-selected");
            }
            pinnedElement = element;
            element.classList.add("is-selected");
            refreshInspector();
            copyText(buildRecognitionText(element.dataset))
              .then(() => showCopyToast("已复制区块识别信息"))
              .catch(() => showCopyToast("复制失败，请重试"));
          });
        });

        document.querySelector(".viewer-stage-frame").addEventListener("click", () => {
          if (pinnedElement) {
            pinnedElement.classList.remove("is-selected");
            pinnedElement = null;
            refreshInspector();
          }
        });
      }

      window.addEventListener("DOMContentLoaded", () => {
        document.body.classList.add("js-ready");
        attachComponentInteractions();
        navItems.forEach((item, index) => {
          item.addEventListener("click", () => setActiveSlide(index));
        });
        prevButton.addEventListener("click", () => setActiveSlide(activeIndex - 1));
        nextButton.addEventListener("click", () => setActiveSlide(activeIndex + 1));
        replayButton.addEventListener("click", () => replayCurrentBuildSequence(true));

        window.addEventListener("keydown", (event) => {
          if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
            event.preventDefault();
            setActiveSlide(activeIndex - 1);
          }
          if (event.key === "ArrowDown" || event.key === "ArrowRight") {
            event.preventDefault();
            setActiveSlide(activeIndex + 1);
          }
          if (event.key === "Escape" && pinnedElement) {
            pinnedElement.classList.remove("is-selected");
            pinnedElement = null;
            refreshInspector();
          }
        });

        setActiveSlide(0, { instant: true });
        scaleStage();
        window.addEventListener("resize", scaleStage);
      });
    })();
  </script>
</body>
</html>`;

  writeText(outputPath, html);
  console.log(`Preview written to ${outputPath}`);
}

if (require.main === module) {
  main();
}
