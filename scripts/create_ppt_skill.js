const fs = require("fs");
const path = require("path");
const { ensureDir, slugify, writeText } = require("./common");
const { ARCHETYPES_DIR, SUBSKILLS_DIR } = require("./catalog");

function createSkillMarkdown({ skillName, displayName, description, archetypeId }) {
  return `---
name: ${skillName}
description: ${description}
---

# ${displayName}

这个子 skill 用于 ${displayName} 场景，建议与主技能 \`ppt-maker\` 配合使用。

## 推荐创建方式

在 \`/Users/minruiqing/MyProjects/My skills/ppt-maker\` 下运行：

\`\`\`bash
node scripts/init_project.js ${archetypeId}-demo "${displayName} Demo" --template business-briefing --archetype ${archetypeId}
\`\`\`

## 适用场景

- 当用户要做 ${displayName}
- 当内容结构比较固定，适合先用特定大纲起稿
- 当希望默认使用该场景的页面顺序、标题方式和版式语言

## 默认建议

- 先用对应 archetype 创建项目
- 再根据内容替换 \`brief.md\` 和 \`deck.json\`
- 视觉模板优先从 \`business-briefing\`、\`launch-stage\`、\`profile-editorial\` 中选择

## 内容提醒

- 保持每页只讲一个重点
- 需要强视觉时优先补封面图和案例图
- 如需新增风格模板或页型变体，请回到主技能 \`ppt-maker\` 更新 catalog
`;
}

function createOpenAiYaml({ displayName, skillName, brandColor }) {
  return `interface:
  display_name: "${displayName}"
  short_description: "面向${displayName}场景的结构化 PPT 子 skill。"
  brand_color: "${brandColor}"
  default_prompt: "Use $${skillName} to create a structured PPT for ${displayName}."

policy:
  allow_implicit_invocation: true
`;
}

function createReference({ displayName, scenario }) {
  return `# ${displayName} 参考结构

## 目标
- ${scenario}

## 推荐大纲
- 封面
- 背景/身份定义
- 关键亮点
- 代表案例或作品
- 结尾/下一步

## 提示
- 优先让每页有明确标题和结论
- 需要图片的页面请明确配图类型
- 如果内容偏叙事，优先选人物风或发布会风模板
`;
}

function createArchetype({ archetypeId, displayName, scenario }) {
  return {
    id: archetypeId,
    label: displayName,
    description: scenario,
    briefSections: ["一句话目标", "受众", "重点内容", "素材清单", "希望呈现的风格"],
    starterDeck: {
      meta: {
        mode: "editable"
      },
      slides: [
        {
          id: "slide-01",
          label: "封面",
          type: "cover",
          components: [
            {
              id: "s01-title",
              label: "封面标题",
              type: "title",
              text: "{{title}}",
              x: 0.9,
              y: 0.9,
              w: 6.2,
              h: 0.8,
              style: {
                fontSize: 30,
                bold: true
              }
            },
            {
              id: "s01-subtitle",
              label: "封面副标题",
              type: "subtitle",
              text: scenario,
              x: 0.95,
              y: 1.8,
              w: 6.4,
              h: 0.45,
              style: {
                fontSize: 16,
                color: "#475569"
              }
            }
          ]
        },
        {
          id: "slide-02",
          label: "核心内容",
          type: "title-bullets",
          components: [
            {
              id: "s02-title",
              label: "核心内容标题",
              type: "title",
              text: "核心内容",
              x: 0.9,
              y: 0.72,
              w: 5.6,
              h: 0.6,
              style: {
                fontSize: 24,
                bold: true
              }
            },
            {
              id: "s02-bullets",
              label: "核心内容列表",
              type: "bullet-list",
              items: ["要点 1", "要点 2", "要点 3"],
              x: 0.95,
              y: 1.8,
              w: 5.3,
              h: 3.2,
              style: {
                fontSize: 18
              }
            }
          ]
        },
        {
          id: "slide-03",
          label: "案例与结尾",
          type: "quote",
          components: [
            {
              id: "s03-title",
              label: "案例与结尾标题",
              type: "title",
              text: "案例与结尾",
              x: 0.9,
              y: 0.72,
              w: 5.8,
              h: 0.6,
              style: {
                fontSize: 24,
                bold: true
              }
            },
            {
              id: "s03-quote",
              label: "总结金句",
              type: "quote-block",
              text: "把这个场景最重要的一句话放在这里。",
              x: 1.0,
              y: 2.05,
              w: 10.0,
              h: 1.5,
              style: {
                fontSize: 24
              }
            }
          ]
        }
      ]
    }
  };
}

function main() {
  const rawSlug = process.argv[2];
  const displayName = process.argv[3];
  const scenario = process.argv[4] || `适合 ${displayName || rawSlug} 的演示文稿生成`;

  if (!rawSlug || !displayName) {
    console.error("Usage: node scripts/create_ppt_skill.js <slug> <display-name> [scenario]");
    process.exit(1);
  }

  const slug = slugify(rawSlug);
  const skillDir = path.join(SUBSKILLS_DIR, slug);
  const agentsDir = path.join(skillDir, "agents");
  const referencesDir = path.join(skillDir, "references");
  const archetypePath = path.join(ARCHETYPES_DIR, `${slug}.json`);
  const skillName = `ppt-${slug}`;

  if (fs.existsSync(skillDir) || fs.existsSync(archetypePath)) {
    console.error(`Skill or archetype already exists for slug: ${slug}`);
    process.exit(1);
  }

  ensureDir(skillDir);
  ensureDir(agentsDir);
  ensureDir(referencesDir);

  writeText(
    path.join(skillDir, "SKILL.md"),
    createSkillMarkdown({
      skillName,
      displayName,
      description: `${scenario}，并复用 ppt-maker 的结构化 deck、模板和导出流程。`,
      archetypeId: slug
    })
  );
  writeText(
    path.join(agentsDir, "openai.yaml"),
    createOpenAiYaml({
      displayName,
      skillName,
      brandColor: "#0F4C81"
    })
  );
  writeText(path.join(referencesDir, "outline.md"), createReference({ displayName, scenario }));
  writeText(path.join(archetypePath), `${JSON.stringify(createArchetype({ archetypeId: slug, displayName, scenario }), null, 2)}\n`);

  console.log(`Subskill created at ${skillDir}`);
  console.log(`Archetype created at ${archetypePath}`);
}

if (require.main === module) {
  main();
}
