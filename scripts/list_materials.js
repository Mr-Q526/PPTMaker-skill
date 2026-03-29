const fs = require("fs");
const path = require("path");
const { SKILL_ROOT } = require("./common");

const MATERIALS_DIR = path.join(SKILL_ROOT, "materials");

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function main() {
  if (!fs.existsSync(MATERIALS_DIR)) {
    console.log("materials/ 目录不存在，请先创建。");
    process.exit(0);
  }

  const entries = fs.readdirSync(MATERIALS_DIR).filter((name) => {
    return !name.startsWith(".") && name !== "README.md";
  });

  if (entries.length === 0) {
    console.log("materials/ 目录为空，请上传参考素材。");
    process.exit(0);
  }

  console.log(`\n📁 参考素材列表 (${MATERIALS_DIR})\n`);
  console.log("-".repeat(60));

  for (const entry of entries) {
    const filePath = path.join(MATERIALS_DIR, entry);
    const stat = fs.statSync(filePath);
    const ext = path.extname(entry).toLowerCase();
    const typeLabel = {
      ".pdf": "📄 PDF",
      ".doc": "📝 Word",
      ".docx": "📝 Word",
      ".txt": "📝 文本",
      ".md": "📝 Markdown",
      ".jpg": "🖼️  图片",
      ".jpeg": "🖼️  图片",
      ".png": "🖼️  图片",
      ".svg": "🖼️  矢量图",
      ".ppt": "📊 PPT",
      ".pptx": "📊 PPT",
      ".xls": "📊 Excel",
      ".xlsx": "📊 Excel",
      ".csv": "📊 CSV",
      ".json": "📦 JSON",
      ".mp4": "🎬 视频",
      ".mp3": "🎵 音频"
    }[ext] || "📎 文件";

    console.log(`  ${typeLabel}  ${entry}  (${formatSize(stat.size)})`);
  }

  console.log("\n" + "-".repeat(60));
  console.log(`  共 ${entries.length} 个素材文件\n`);
}

if (require.main === module) {
  main();
}
