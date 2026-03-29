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

这个子 skill 用于 ${displayName} 场景，默认复用 \`ppt-maker\` 的结构化 deck、预览和导出流程。

## 何时使用

- 用户要做 ${displayName}
- 该场景的结构相对固定，适合先按 archetype 起稿
- 需要在统一模板下做后续自然语言修改

## 默认选择

- archetype：\`${archetypeId}\`
- template：优先 \`business-briefing\`
- 推荐页数：\`4-6 页\`

## 推荐起稿命令

在 \`/Users/minruiqing/MyProjects/My skills/ppt-maker\` 下运行：

\`\`\`bash
node scripts/init_project.js ${archetypeId}-demo "${displayName} Demo" --template business-briefing --archetype ${archetypeId}
\`\`\`

## 输入时优先补齐的信息

- 目标听众
- 核心问题或展示目标
- 必须出现的案例、数据或素材
- 希望呈现的风格与重点

## 输出要求

- 每页只保留一个重点
- 标题优先写成结论或记忆点
- 视觉上优先用现有页型和组件实现，不依赖未支持的复杂特效

## 维护提醒

- 如果该场景需要更专门的大纲，请同步更新 \`references/outline.md\`
- 如果该场景的 starter deck 不够贴合，请同步更新对应 archetype
- 如果需要新增风格模板或页型变体，请回到主技能 \`ppt-maker\` 更新 catalog
`;
}

function createOpenAiYaml({ displayName, skillName, brandColor }) {
  return `interface:
  display_name: "${displayName}"
  short_description: "面向${displayName}场景的结构化 PPT 子 skill。"
  brand_color: "${brandColor}"
  default_prompt: "Use $${skillName} to create a 4-6 page structured PPT for ${displayName} with a clear audience, core message, and closing."

policy:
  allow_implicit_invocation: true
`;
}

function createReference({ displayName, scenario }) {
  return `# ${displayName} 参考结构

1. 封面
   - 标题、对象、场景一句话定义

2. 背景 / 问题
   - 为什么要讲这个主题，听众需要知道什么

3. 核心内容
   - 2 到 4 个重点信息或一个关键案例

4. 结尾 / 下一步
   - 总结句、行动建议或合作方式

## 提示

- ${scenario}
- 优先让每页有明确标题和结论
- 如果需要图片，请明确配图类型或截图来源
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
          layoutVariant: "hero-left",
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
            },
            {
              id: "s01-image",
              label: "封面配图",
              type: "image",
              src: "../../assets/preview/placeholder-graphic.svg",
              fit: "contain",
              x: 7.75,
              y: 1.05,
              w: 4.1,
              h: 3.9
            }
          ]
        },
        {
          id: "slide-02",
          label: "背景与问题",
          type: "title-bullets",
          layoutVariant: "evidence-split",
          components: [
            {
              id: "s02-title",
              label: "背景标题",
              type: "title",
              text: "背景与问题",
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
              label: "背景列表",
              type: "bullet-list",
              items: ["背景是什么", "为什么重要", "这一页要回答什么问题"],
              x: 0.95,
              y: 1.8,
              w: 5.3,
              h: 3.2,
              style: {
                fontSize: 18
              }
            },
            {
              id: "s02-text",
              label: "背景补充",
              type: "text",
              text: "这里放一条补充说明、数据或案例场景。",
              x: 6.95,
              y: 1.85,
              w: 4.25,
              h: 1.4,
              style: {
                fontSize: 18,
                color: "#334155"
              }
            }
          ]
        },
        {
          id: "slide-03",
          label: "核心内容",
          type: "image-text",
          layoutVariant: "media-right-focus",
          components: [
            {
              id: "s03-title",
              label: "核心内容标题",
              type: "title",
              text: "核心内容",
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
              id: "s03-text",
              label: "核心内容说明",
              type: "bullet-list",
              items: ["要点 1", "要点 2", "要点 3"],
              x: 0.95,
              y: 1.85,
              w: 5.15,
              h: 3.2,
              style: {
                fontSize: 18
              }
            },
            {
              id: "s03-image",
              label: "内容配图",
              type: "image",
              src: "../../assets/preview/placeholder-graphic.svg",
              fit: "contain",
              x: 7.0,
              y: 1.55,
              w: 4.2,
              h: 3.75
            }
          ]
        },
        {
          id: "slide-04",
          label: "结尾",
          type: "quote",
          layoutVariant: "pull-quote",
          components: [
            {
              id: "s04-title",
              label: "结尾标题",
              type: "title",
              text: "结尾与下一步",
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
              id: "s04-quote",
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
