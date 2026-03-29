const path = require("path");
const { execFileSync } = require("child_process");

function runScript(scriptName, args) {
  const scriptPath = path.join(__dirname, scriptName);
  execFileSync(process.execPath, [scriptPath, ...args], { stdio: "inherit" });
}

function main() {
  const projectArg = process.argv[2];
  if (!projectArg) {
    console.error("Usage: node scripts/build_project.js <project-dir> [--export]");
    process.exit(1);
  }

  const shouldExport = process.argv.includes("--export");
  const projectDir = path.resolve(projectArg);
  const deckPath = path.join(projectDir, "deck.json");
  const previewPath = path.join(projectDir, "preview.html");
  const projectSlug = path.basename(projectDir);
  const outputPath = path.join(projectDir, `${projectSlug}.pptx`);

  runScript("validate_deck.js", [deckPath]);
  runScript("render_preview.js", [deckPath, previewPath]);

  if (shouldExport) {
    runScript("export_ppt.js", [deckPath, outputPath]);
    console.log(`Project built with export in ${projectDir}`);
  } else {
    console.log(`Project built in ${projectDir} (preview only, use --export to generate .pptx)`);
  }
}

if (require.main === module) {
  main();
}
