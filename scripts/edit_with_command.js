const path = require("path");
const { readJson, writeText } = require("./common");
const { applyOperations } = require("./apply_edit");
const { planOperations } = require("./plan_edit");

function main() {
  const deckArg = process.argv[2];
  const instructionArg = process.argv[3];
  const outputDeckArg = process.argv[4];
  const outputPlanArg = process.argv[5];

  if (!deckArg || !instructionArg || !outputDeckArg) {
    console.error("Usage: node scripts/edit_with_command.js <deck.json> <instruction> <output-deck.json> [output-plan.json]");
    process.exit(1);
  }

  const deck = readJson(path.resolve(deckArg));
  const plan = planOperations(deck, instructionArg);
  applyOperations(deck, plan.operations);

  writeText(path.resolve(outputDeckArg), `${JSON.stringify(deck, null, 2)}\n`);
  if (outputPlanArg) {
    writeText(path.resolve(outputPlanArg), `${JSON.stringify(plan, null, 2)}\n`);
  }

  console.log(`Command applied to ${path.resolve(outputDeckArg)}`);
  console.log(JSON.stringify(plan, null, 2));
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
