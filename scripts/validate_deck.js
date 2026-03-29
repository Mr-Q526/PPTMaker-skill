const path = require("path");
const Ajv = require("ajv");
const { readJson } = require("./common");

const componentSchema = {
  type: "object",
  required: ["id", "type", "x", "y", "w", "h"],
  properties: {
    id: { type: "string", minLength: 1 },
    label: { type: "string" },
    role: { type: "string" },
    aliases: {
      type: "array",
      items: { type: "string" }
    },
    type: {
      type: "string",
      enum: [
        "title",
        "subtitle",
        "text",
        "bullet-list",
        "image",
        "divider",
        "quote-block",
        "table",
        "chart",
        "shape"
      ]
    },
    x: { type: "number", minimum: 0 },
    y: { type: "number", minimum: 0 },
    w: { type: "number", exclusiveMinimum: 0 },
    h: { type: "number", exclusiveMinimum: 0 },
    text: { type: "string" },
    items: {
      type: "array",
      items: { type: "string" }
    },
    src: { type: "string" },
    rows: {
      type: "array",
      items: {
        type: "array",
        items: { type: ["string", "number"] }
      }
    },
    kind: {
      type: "string",
      enum: ["bar", "line", "pie"]
    },
    categories: {
      type: "array",
      items: { type: "string" }
    },
    series: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "values"],
        properties: {
          name: { type: "string" },
          values: {
            type: "array",
            items: { type: "number" }
          }
        }
      }
    },
    shape: {
      type: "string",
      enum: ["rect", "roundedRect", "circle"]
    },
    animation: {
      type: "object",
      properties: {
        effect: {
          type: "string",
          enum: ["fade-in", "slide-up", "zoom-in"]
        },
        build: {
          type: "integer",
          minimum: 1
        },
        durationMs: {
          type: "integer",
          minimum: 100
        },
        delayMs: {
          type: "integer",
          minimum: 0
        },
        easing: { type: "string" }
      }
    },
    style: { type: "object" }
  },
  allOf: [
    {
      if: {
        properties: { type: { const: "bullet-list" } }
      },
      then: {
        required: ["items"]
      }
    },
    {
      if: {
        properties: { type: { const: "image" } }
      },
      then: {
        required: ["src"]
      }
    },
    {
      if: {
        properties: { type: { const: "table" } }
      },
      then: {
        required: ["rows"]
      }
    },
    {
      if: {
        properties: { type: { const: "chart" } }
      },
      then: {
        required: ["kind", "categories", "series"]
      }
    },
    {
      if: {
        properties: {
          type: {
            enum: ["title", "subtitle", "text", "quote-block"]
          }
        }
      },
      then: {
        required: ["text"]
      }
    }
  ],
  additionalProperties: true
};

const deckSchema = {
  type: "object",
  required: ["meta", "slides"],
  properties: {
    meta: {
      type: "object",
      required: ["title", "theme", "ratio", "mode"],
      properties: {
        title: { type: "string", minLength: 1 },
        theme: { type: "string", minLength: 1 },
        template: { type: "string" },
        archetype: { type: "string" },
        ratio: { type: "string", const: "16:9" },
        mode: { type: "string", enum: ["editable", "fidelity"] }
      }
    },
    slides: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["id", "type", "components"],
        properties: {
          id: { type: "string", minLength: 1 },
          label: { type: "string" },
          layoutVariant: { type: "string" },
          type: {
            type: "string",
            enum: [
              "cover",
              "agenda",
              "section",
              "title-bullets",
              "two-column",
              "image-text",
              "comparison",
              "timeline",
              "table",
              "chart",
              "quote"
            ]
          },
          components: {
            type: "array",
            items: componentSchema
          }
        }
      }
    }
  }
};

function checkUniqueIds(deck) {
  const seenSlides = new Set();
  const seenComponents = new Set();

  for (const slide of deck.slides) {
    if (seenSlides.has(slide.id)) {
      return `Duplicate slide id: ${slide.id}`;
    }
    seenSlides.add(slide.id);

    for (const component of slide.components || []) {
      if (seenComponents.has(component.id)) {
        return `Duplicate component id: ${component.id}`;
      }
      seenComponents.add(component.id);
    }
  }

  return null;
}

function main() {
  const deckArg = process.argv[2];
  if (!deckArg) {
    console.error("Usage: node scripts/validate_deck.js <deck.json>");
    process.exit(1);
  }

  const deckPath = path.resolve(deckArg);
  const deck = readJson(deckPath);
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(deckSchema);
  const valid = validate(deck);

  if (!valid) {
    console.error(`Deck validation failed for ${deckPath}`);
    for (const error of validate.errors) {
      console.error(`- ${error.instancePath || "/"} ${error.message}`);
    }
    process.exit(1);
  }

  const duplicateError = checkUniqueIds(deck);
  if (duplicateError) {
    console.error(duplicateError);
    process.exit(1);
  }

  console.log(`Deck is valid: ${deckPath}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  deckSchema
};
