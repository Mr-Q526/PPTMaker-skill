const path = require("path");
const { PPT_LAYOUT, clamp, findComponent, findSlide, readJson, writeText } = require("./common");

function clampComponent(component) {
  component.w = clamp(component.w, 0.4, PPT_LAYOUT.width);
  component.h = clamp(component.h, 0.2, PPT_LAYOUT.height);
  component.x = clamp(component.x, 0, Math.max(PPT_LAYOUT.width - component.w, 0));
  component.y = clamp(component.y, 0, Math.max(PPT_LAYOUT.height - component.h, 0));
}

function updateComponentFrame(component, updates, relative = false) {
  for (const key of ["x", "y", "w", "h"]) {
    if (typeof updates[key] === "number") {
      component[key] = relative ? component[key] + updates[key] : updates[key];
    }
  }
  clampComponent(component);
}

function applyTwoColumnLayout(slide) {
  const components = slide.components || [];
  const titleLike = [];
  const body = [];

  for (const component of components) {
    if ((component.type === "title" || component.type === "subtitle") && component.y < 1.7) {
      titleLike.push(component);
    } else {
      body.push(component);
    }
  }

  titleLike.sort((a, b) => a.y - b.y);
  body.sort((a, b) => a.x - b.x || a.y - b.y);

  if (titleLike[0]) {
    titleLike[0].x = 0.9;
    titleLike[0].y = 0.72;
    titleLike[0].w = 7.4;
    titleLike[0].h = 0.65;
    clampComponent(titleLike[0]);
  }
  if (titleLike[1]) {
    titleLike[1].x = 0.9;
    titleLike[1].y = 1.28;
    titleLike[1].w = 7.0;
    titleLike[1].h = 0.4;
    clampComponent(titleLike[1]);
  }

  const slots = [
    { x: 0.9, y: 1.95, w: 5.5, h: 4.35 },
    { x: 6.95, y: 1.95, w: 5.45, h: 4.35 },
    { x: 0.9, y: 6.5, w: 5.5, h: 0.5 },
    { x: 6.95, y: 6.5, w: 5.45, h: 0.5 }
  ];

  body.forEach((component, index) => {
    if (!slots[index]) {
      return;
    }
    Object.assign(component, slots[index]);
    clampComponent(component);
  });

  slide.type = "two-column";
}

function applyOperation(deck, operation) {
  switch (operation.type) {
    case "replace-text": {
      const match = findComponent(deck.slides, operation.componentId);
      if (!match) {
        throw new Error(`Component not found: ${operation.componentId}`);
      }
      match.component.text = operation.text;
      return;
    }
    case "set-style": {
      const match = findComponent(deck.slides, operation.componentId);
      if (!match) {
        throw new Error(`Component not found: ${operation.componentId}`);
      }
      match.component.style = {
        ...(match.component.style || {}),
        ...(operation.style || {})
      };
      return;
    }
    case "move-component": {
      const match = findComponent(deck.slides, operation.componentId);
      if (!match) {
        throw new Error(`Component not found: ${operation.componentId}`);
      }
      updateComponentFrame(match.component, operation, false);
      return;
    }
    case "nudge-component": {
      const match = findComponent(deck.slides, operation.componentId);
      if (!match) {
        throw new Error(`Component not found: ${operation.componentId}`);
      }
      updateComponentFrame(match.component, operation, true);
      return;
    }
    case "delete-component": {
      for (const slide of deck.slides) {
        const nextComponents = (slide.components || []).filter(
          (component) => component.id !== operation.componentId
        );
        if (nextComponents.length !== slide.components.length) {
          slide.components = nextComponents;
          return;
        }
      }
      throw new Error(`Component not found: ${operation.componentId}`);
    }
    case "set-meta": {
      if (!operation.key) {
        throw new Error("Missing meta key for set-meta");
      }
      deck.meta[operation.key] = operation.value;
      return;
    }
    case "set-chart-kind": {
      const match = findComponent(deck.slides, operation.componentId);
      if (!match) {
        throw new Error(`Component not found: ${operation.componentId}`);
      }
      match.component.kind = operation.kind;
      return;
    }
    case "apply-layout-preset": {
      const slide = findSlide(deck.slides, operation.slideId);
      if (!slide) {
        throw new Error(`Slide not found: ${operation.slideId}`);
      }
      if (operation.preset === "two-column") {
        applyTwoColumnLayout(slide);
        return;
      }
      throw new Error(`Unsupported layout preset: ${operation.preset}`);
    }
    default:
      throw new Error(`Unsupported edit operation: ${operation.type}`);
  }
}

function applyOperations(deck, operations) {
  for (const operation of operations) {
    applyOperation(deck, operation);
  }
  return deck;
}

function main() {
  const deckArg = process.argv[2];
  const editsArg = process.argv[3];
  const outputArg = process.argv[4];
  if (!deckArg || !editsArg || !outputArg) {
    console.error("Usage: node scripts/apply_edit.js <deck.json> <edits.json> <output.json>");
    process.exit(1);
  }

  const deck = readJson(path.resolve(deckArg));
  const editBundle = readJson(path.resolve(editsArg));
  const operations = Array.isArray(editBundle) ? editBundle : editBundle.operations || [];

  applyOperations(deck, operations);

  writeText(path.resolve(outputArg), `${JSON.stringify(deck, null, 2)}\n`);
  console.log(`Edited deck written to ${path.resolve(outputArg)}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  applyOperation,
  applyOperations
};
