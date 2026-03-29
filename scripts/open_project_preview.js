const path = require("path");
const { execFileSync } = require("child_process");

function runScript(scriptName, args) {
  const scriptPath = path.join(__dirname, scriptName);
  execFileSync(process.execPath, [scriptPath, ...args], { stdio: "inherit" });
}

function main() {
  const projectArg = process.argv[2];
  if (!projectArg) {
    console.error("Usage: node scripts/open_project_preview.js <project-dir> [--export]");
    process.exit(1);
  }

  const shouldExport = process.argv.includes("--export");
  const projectDir = path.resolve(projectArg);
  const deckPath = path.join(projectDir, "deck.json");
  const previewPath = path.join(projectDir, "preview.html");
  const projectSlug = path.basename(projectDir);
  const outputPath = path.join(projectDir, `${projectSlug}.pptx`);

  runScript("validate_deck.js", [deckPath]);

  if (shouldExport) {
    runScript("export_ppt.js", [deckPath, outputPath]);
  }

  runScript("render_preview.js", [deckPath, previewPath]);
  execFileSync("open", [previewPath], { stdio: "inherit" });

  console.log(`Preview opened: ${previewPath}`);
}

if (require.main === module) {
  main();
}
