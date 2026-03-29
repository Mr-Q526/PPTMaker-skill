const fs = require("fs");
const path = require("path");
const { ensureDir, slugify, writeText } = require("./common");
const { buildBriefMarkdown, buildDeckFromCatalog, listArchetypes, listTemplates } = require("./catalog");

function nextAvailableProjectDir(baseDir, slug) {
  const firstPath = path.join(baseDir, slug);
  if (!fs.existsSync(firstPath)) {
    return firstPath;
  }

  let index = 2;
  while (true) {
    const candidate = path.join(baseDir, `${slug}-${index}`);
    if (!fs.existsSync(candidate)) {
      return candidate;
    }
    index += 1;
  }
}

function parseArgs(argv) {
  if (!argv.length) {
    return null;
  }

  const [projectName, ...rest] = argv;
  const titleParts = [];
  let templateName = "business-briefing";
  let archetypeName = "general-briefing";

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (token === "--template") {
      templateName = rest[index + 1];
      index += 1;
      continue;
    }
    if (token === "--archetype") {
      archetypeName = rest[index + 1];
      index += 1;
      continue;
    }
    titleParts.push(token);
  }

  return {
    projectName,
    title: titleParts.join(" ").trim() || projectName,
    templateName,
    archetypeName
  };
}

function printCatalogHint() {
  const templates = listTemplates()
    .map((item) => `${item.id}(${item.label})`)
    .join(", ");
  const archetypes = listArchetypes()
    .map((item) => `${item.id}(${item.label})`)
    .join(", ");

  console.error(`Templates: ${templates}`);
  console.error(`Archetypes: ${archetypes}`);
}

function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed) {
    console.error("Usage: node scripts/init_project.js <project-name> [title] [--template <id>] [--archetype <id>]");
    printCatalogHint();
    process.exit(1);
  }
  const { projectName, title, templateName, archetypeName } = parsed;

  const projectsDir = path.resolve(path.join(__dirname, "..", "projects"));
  ensureDir(projectsDir);
  const slug = slugify(projectName);
  const projectDir = nextAvailableProjectDir(projectsDir, slug);

  ensureDir(projectDir);
  ensureDir(path.join(projectDir, "assets"));
  ensureDir(path.join(projectDir, "exports"));

  const metadata = {
    name: title,
    slug: path.basename(projectDir),
    createdAt: new Date().toISOString(),
    template: templateName,
    archetype: archetypeName,
    deck: "deck.json",
    preview: "preview.html",
    output: `${path.basename(projectDir)}.pptx`,
    notes: "brief.md"
  };

  let catalogBundle;
  try {
    catalogBundle = buildDeckFromCatalog({
      title,
      templateName,
      archetypeName
    });
  } catch (error) {
    console.error(error.message);
    printCatalogHint();
    process.exit(1);
  }

  const brief = buildBriefMarkdown({
    title,
    template: catalogBundle.template,
    archetype: catalogBundle.archetype
  });

  writeText(path.join(projectDir, "project.json"), `${JSON.stringify(metadata, null, 2)}\n`);
  writeText(path.join(projectDir, "brief.md"), brief);
  writeText(path.join(projectDir, "deck.json"), `${JSON.stringify(catalogBundle.deck, null, 2)}\n`);

  console.log(`Project created at ${projectDir}`);
}

if (require.main === module) {
  main();
}
