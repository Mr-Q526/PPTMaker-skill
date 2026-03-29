const fs = require("fs");
const path = require("path");
const { SKILL_ROOT, cloneJson, readJson } = require("./common");

const TEMPLATES_DIR = path.join(SKILL_ROOT, "assets", "templates");
const ARCHETYPES_DIR = path.join(SKILL_ROOT, "assets", "archetypes");
const LAYOUT_LIBRARY_PATH = path.join(SKILL_ROOT, "assets", "layouts", "library.json");
const SUBSKILLS_DIR = path.join(SKILL_ROOT, "subskills");

function listJsonEntries(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => readJson(path.join(dirPath, fileName)))
    .sort((left, right) => String(left.label || left.id).localeCompare(String(right.label || right.id), "zh-CN"));
}

function listTemplates() {
  return listJsonEntries(TEMPLATES_DIR);
}

function listArchetypes() {
  return listJsonEntries(ARCHETYPES_DIR);
}

function resolveTemplate(templateName = "business-briefing") {
  const target = path.join(TEMPLATES_DIR, `${templateName}.json`);
  if (!fs.existsSync(target)) {
    throw new Error(`Template not found: ${templateName}`);
  }
  return readJson(target);
}

function resolveArchetype(archetypeName = "general-briefing") {
  const target = path.join(ARCHETYPES_DIR, `${archetypeName}.json`);
  if (!fs.existsSync(target)) {
    throw new Error(`Archetype not found: ${archetypeName}`);
  }
  return readJson(target);
}

function loadLayoutLibrary() {
  return readJson(LAYOUT_LIBRARY_PATH);
}

function readSubskillMetadata(skillDir) {
  const skillPath = path.join(skillDir, "SKILL.md");
  if (!fs.existsSync(skillPath)) {
    return null;
  }

  const content = fs.readFileSync(skillPath, "utf8");
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const frontmatter = frontmatterMatch ? frontmatterMatch[1] : "";
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  const descriptionMatch = frontmatter.match(/^description:\s*(.+)$/m);
  return {
    id: path.basename(skillDir),
    name: nameMatch ? nameMatch[1].trim() : path.basename(skillDir),
    description: descriptionMatch ? descriptionMatch[1].trim() : ""
  };
}

function listSubskills() {
  if (!fs.existsSync(SUBSKILLS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(SUBSKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readSubskillMetadata(path.join(SUBSKILLS_DIR, entry.name)))
    .filter(Boolean)
    .sort((left, right) => String(left.id).localeCompare(String(right.id), "zh-CN"));
}

function replaceTokens(value, tokens) {
  if (typeof value === "string") {
    return value.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      if (!(key in tokens)) {
        return match;
      }
      return String(tokens[key]);
    });
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceTokens(item, tokens));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, replaceTokens(nestedValue, tokens)])
    );
  }

  return value;
}

function buildDeckFromCatalog({ title, templateName, archetypeName }) {
  const template = resolveTemplate(templateName);
  const archetype = resolveArchetype(archetypeName);
  const starterDeck = cloneJson(archetype.starterDeck || {});
  const tokens = {
    title,
    archetypeLabel: archetype.label,
    templateLabel: template.label
  };

  const deck = replaceTokens(starterDeck, tokens);
  deck.meta = {
    title,
    theme: template.theme || deck.meta.theme || "business-clean",
    ratio: "16:9",
    mode: deck.meta.mode || "editable",
    template: template.id,
    archetype: archetype.id
  };

  for (const slide of deck.slides || []) {
    if (!slide.layoutVariant && template.layoutVariants && template.layoutVariants[slide.type]) {
      slide.layoutVariant = template.layoutVariants[slide.type];
    }
  }

  return {
    deck,
    template,
    archetype
  };
}

function buildBriefMarkdown({ title, template, archetype }) {
  const sections = archetype.briefSections || ["目标", "关键信息"];
  const sectionLines = sections
    .map((section) => `## ${section}\n- `)
    .join("\n\n");

  return `# ${title}\n\n- 场景结构：${archetype.label} (${archetype.id})\n- 模板：${template.label} (${template.id})\n- 主题：${template.theme}\n\n${sectionLines}\n`;
}

module.exports = {
  ARCHETYPES_DIR,
  LAYOUT_LIBRARY_PATH,
  SUBSKILLS_DIR,
  TEMPLATES_DIR,
  buildBriefMarkdown,
  buildDeckFromCatalog,
  listArchetypes,
  listSubskills,
  listTemplates,
  loadLayoutLibrary,
  resolveArchetype,
  resolveTemplate
};
