import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public/icons");
const BG = "#020617";

function pipelineMark() {
  return `
    <defs>
      <linearGradient id="brand-pipe" x1="16" y1="3" x2="16" y2="29" gradientUnits="userSpaceOnUse">
        <stop stop-color="#93c5fd"/>
        <stop offset="0.55" stop-color="#2563eb"/>
        <stop offset="1" stop-color="#1e3a8a"/>
      </linearGradient>
    </defs>
    <rect x="4.2" y="3.4" width="9.2" height="25.2" rx="4.6" fill="none" stroke="url(#brand-pipe)" stroke-width="2.5"/>
    <rect x="18.6" y="3.4" width="9.2" height="14.6" rx="4.6" fill="none" stroke="url(#brand-pipe)" stroke-width="2.5"/>
  `;
}

function markSvg(size, { rounded = true, padRatio = 0.2 } = {}) {
  const radius = rounded ? Math.round(size * 0.22) : 0;
  const usable = size * (1 - padRatio * 2);
  const scale = usable / 32;
  const x = (size - 32 * scale) / 2;
  const y = (size - 32 * scale) / 2;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${BG}"/>
  <g transform="translate(${x} ${y}) scale(${scale})">
    ${pipelineMark()}
  </g>
</svg>`;
}

async function writePng(path, svg) {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path);
  console.log("wrote", path);
}

await mkdir(outDir, { recursive: true });
await mkdir(join(root, "src/app"), { recursive: true });

await writePng(join(outDir, "icon-192.png"), markSvg(192));
await writePng(join(outDir, "icon-512.png"), markSvg(512));
await writePng(join(outDir, "icon-maskable-512.png"), markSvg(512, { rounded: false, padRatio: 0.22 }));
await writePng(join(root, "src/app/icon.png"), markSvg(48));
await writePng(join(root, "src/app/apple-icon.png"), markSvg(180));
await writePng(join(outDir, "apple-touch-icon.png"), markSvg(180));
