const fs = require("fs");
const path = require("path");

const SKILL_ROOT = path.resolve(__dirname, "..");
const PREVIEW_WIDTH = 1280;
const PREVIEW_HEIGHT = 720;
const PPT_LAYOUT = {
  width: 13.333,
  height: 7.5
};
const PX_PER_INCH = PREVIEW_WIDTH / PPT_LAYOUT.width;
const ANIMATION_EFFECTS = new Set(["fade-in", "slide-up", "zoom-in"]);

function readJson(filePath) {
  const absolutePath = path.resolve(filePath);
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function writeText(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function resolveTheme(themeName) {
  const themePath = path.join(SKILL_ROOT, "assets", "themes", `${themeName}.json`);
  if (!fs.existsSync(themePath)) {
    throw new Error(`Theme not found: ${themeName}`);
  }
  return readJson(themePath);
}

function resolveAssetPath(assetPath, deckPath) {
  if (!assetPath) {
    return null;
  }
  if (path.isAbsolute(assetPath)) {
    return assetPath;
  }
  return path.resolve(path.dirname(deckPath), assetPath);
}

function loadBaseCss() {
  const cssPath = path.join(SKILL_ROOT, "assets", "preview", "base.css");
  return fs.readFileSync(cssPath, "utf8");
}

function toPreviewPx(valueInches) {
  return `${Number(valueInches) * PX_PER_INCH}px`;
}

function toPptHex(colorValue, fallback = "111827") {
  if (!colorValue) {
    return fallback;
  }
  return String(colorValue).replace("#", "");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function componentBoxStyle(component) {
  return [
    `left:${toPreviewPx(component.x)}`,
    `top:${toPreviewPx(component.y)}`,
    `width:${toPreviewPx(component.w)}`,
    `height:${toPreviewPx(component.h)}`
  ].join(";");
}

function findComponent(slides, componentId) {
  for (const slide of slides) {
    for (const component of slide.components || []) {
      if (component.id === componentId) {
        return { slide, component };
      }
    }
  }
  return null;
}

function findSlide(slides, slideId) {
  return (slides || []).find((slide) => slide.id === slideId) || null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeAnimation(component) {
  const config = component && typeof component.animation === "object" ? component.animation : {};
  const build = Number.isInteger(config.build) && config.build > 0 ? config.build : 0;
  const requestedEffect = typeof config.effect === "string" ? config.effect : build > 0 ? "fade-in" : null;
  const effect = ANIMATION_EFFECTS.has(requestedEffect) ? requestedEffect : requestedEffect ? "fade-in" : null;
  const durationMs = Number.isFinite(config.durationMs) && config.durationMs > 0 ? config.durationMs : 640;
  const delayMs = Number.isFinite(config.delayMs) && config.delayMs >= 0 ? config.delayMs : build > 0 ? 180 + (build - 1) * 420 : 0;
  const easing =
    typeof config.easing === "string" && config.easing.trim()
      ? config.easing.trim()
      : "cubic-bezier(0.2, 0.8, 0.2, 1)";

  return {
    build,
    delayMs,
    durationMs,
    easing,
    effect
  };
}

function getBuildStages(components = []) {
  return Array.from(
    new Set(
      components
        .map((component) => normalizeAnimation(component).build)
        .filter(Boolean)
    )
  ).sort((left, right) => left - right);
}

module.exports = {
  ANIMATION_EFFECTS,
  PPT_LAYOUT,
  PREVIEW_WIDTH,
  PREVIEW_HEIGHT,
  PX_PER_INCH,
  SKILL_ROOT,
  cloneJson,
  componentBoxStyle,
  clamp,
  ensureDir,
  escapeHtml,
  findComponent,
  findSlide,
  getBuildStages,
  loadBaseCss,
  normalizeAnimation,
  readJson,
  resolveAssetPath,
  resolveTheme,
  slugify,
  toPptHex,
  toPreviewPx,
  writeText
};
