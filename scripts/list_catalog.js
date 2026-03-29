const {
  listArchetypes,
  listSubskills,
  listTemplates,
  loadLayoutLibrary
} = require("./catalog");

function printSection(title, items) {
  console.log(`\n${title}`);
  for (const item of items) {
    console.log(`- ${item}`);
  }
}

function main() {
  const templates = listTemplates().map(
    (item) => `${item.id} | ${item.label} | ${item.description} | theme=${item.theme}`
  );
  const archetypes = listArchetypes().map(
    (item) => `${item.id} | ${item.label} | ${item.description}`
  );
  const subskills = listSubskills().map(
    (item) => `${item.id} | ${item.name} | ${item.description}`
  );
  const layoutLibrary = loadLayoutLibrary();
  const layouts = Object.entries(layoutLibrary.slideTypes || {}).map(
    ([slideType, variants]) => `${slideType} | ${variants.map((variant) => `${variant.id}(${variant.label})`).join(", ")}`
  );

  printSection("Templates", templates);
  printSection("Archetypes", archetypes);
  printSection("Layout Variants", layouts);
  printSection("Subskills", subskills);
}

if (require.main === module) {
  main();
}
