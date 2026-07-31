import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicImgDir = path.join(__dirname, "..", "public", "img");

const SIZES = {
  avatars: [256, 256],
  covers: [640, 800],
  scenarios: [800, 600],
  languages: [640, 800],
  textures: [1200, 800],
};

const MANIFEST = {
  avatars: [
    "archivist-glasses",
    "scholar-coat",
    "archivist-suit",
    "scholar-lamp",
    "archivist-monocle",
    "scholar-hornrim",
    "learner-focused",
    "academic-silver",
    "scholar-turtleneck",
    "learner-cheerful",
    "learner-confident",
    "creative-glasses",
    "academic-curious",
    "student-studio",
    "linguist-bw",
    "user-default",
  ],
  covers: ["midnight-cafe", "silicon-valley", "echoes-void"],
  scenarios: ["interview", "casual", "restaurant", "airport"],
  languages: ["english-london", "russian-moscow", "tajik-pamir"],
  textures: [
    "artifacts-desk",
    "brutalist-stairs",
    "tape-reel",
    "underwater-light",
    "typewriter-g",
    "swiss-circles",
    "london-noir",
    "robot-dandelion",
    "gramophone",
    "linguistic-blueprint",
    "misty-lake",
    "vintage-map",
  ],
};

function placeholderSvg({ width, height, category, name }) {
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) * 0.22;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" fill="#fcf9f6" stroke="#000000" stroke-width="2"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#b90538" stroke-width="3"/>
  <line x1="${cx - r * 1.4}" y1="${cy}" x2="${cx + r * 1.4}" y2="${cy}" stroke="#b90538" stroke-width="3"/>
  <line x1="${cx}" y1="${cy - r * 1.4}" x2="${cx}" y2="${cy + r * 1.4}" stroke="#b90538" stroke-width="3"/>
  <text x="${width / 2}" y="${height - 24}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="14" fill="#000000" letter-spacing="2">${category.toUpperCase()}</text>
  <text x="${width / 2}" y="${height - 8}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#000000" opacity="0.6">${name}</text>
</svg>
`;
}

async function main() {
  for (const [category, names] of Object.entries(MANIFEST)) {
    const [width, height] = SIZES[category];
    const dir = path.join(publicImgDir, category);
    await mkdir(dir, { recursive: true });

    for (const name of names) {
      const svg = placeholderSvg({ width, height, category, name });
      await writeFile(path.join(dir, `${name}.webp`), svg, "utf8");

      if (category !== "avatars") {
        const svg2x = placeholderSvg({ width: width * 2, height: height * 2, category, name });
        await writeFile(path.join(dir, `${name}@2x.webp`), svg2x, "utf8");
      }
    }
    console.log(`${category}: ${names.length} placeholder(s) written to ${dir}`);
  }
}

main();
