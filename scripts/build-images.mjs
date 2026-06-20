import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const rawDir = path.join(root, "raw/images");
const webpDir = path.join(root, "docs/assets/img");
const downloadsDir = path.join(root, "docs/assets/downloads");
const iconsDir = path.join(root, "docs/assets/icons");

// 表示用 WebP: [出力名, 元画像名(拡張子なし), 最大幅]
const displayImages = [
  ["letter", "letter", 1200],
  ["sheep-letter", "sheep-letter", 480],
  ["sheep-build", "sheep-build", 480],
  ["sheep-wait", "sheep-wait", 480],
  ["sheep-swim", "sheep-swim", 480],
];

// ダウンロード用 PNG（高品質・リサイズなし）
const downloadNames = ["letter"];

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true });
};

const resolveSource = async (name) => {
  const candidates = [".png", ".jpg", ".jpeg"].map((ext) => path.join(rawDir, `${name}${ext}`));
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // continue
    }
  }
  throw new Error(`Source image not found for '${name}' in raw/images`);
};

const buildDisplayWebp = async (outName, srcName, maxWidth) => {
  const inputPath = await resolveSource(srcName);
  const outputPath = path.join(webpDir, `${outName}.webp`);
  await sharp(inputPath)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(outputPath);
};

// 透過キービジュアル（Charlotte）を青いパーティクル背景に重ねてヒーロー画像を合成
const buildHeroWebp = async () => {
  const backgroundPath = await resolveSource("background");
  const keyVisualPath = await resolveSource("key-visual");
  const outputPath = path.join(webpDir, "hero.webp");
  const heroWidth = 1600;
  // 背景と立ち絵を同一サイズへ揃えてから重ねる
  const background = await sharp(backgroundPath)
    .resize({ width: heroWidth, withoutEnlargement: true })
    .toBuffer();
  const { width, height } = await sharp(background).metadata();
  const keyVisual = await sharp(keyVisualPath)
    .ensureAlpha()
    .resize({ width, height, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp(background)
    .composite([{ input: keyVisual }])
    .webp({ quality: 84 })
    .toFile(outputPath);
};

const buildDownloadPng = async (name) => {
  const inputPath = await resolveSource(name);
  const outputPath = path.join(downloadsDir, `${name}.png`);
  await sharp(inputPath).png({ compressionLevel: 9 }).toFile(outputPath);
};

const buildFaviconPng = async () => {
  const inputPath = await resolveSource("sheep-wait");
  const outputPath = path.join(iconsDir, "favicon.png");
  await sharp(inputPath)
    .resize(96, 96, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
      withoutEnlargement: true,
    })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
};

const main = async () => {
  await Promise.all([ensureDir(webpDir), ensureDir(downloadsDir), ensureDir(iconsDir)]);

  await buildHeroWebp();

  for (const [outName, srcName, maxWidth] of displayImages) {
    await buildDisplayWebp(outName, srcName, maxWidth);
  }

  for (const name of downloadNames) {
    await buildDownloadPng(name);
  }

  await buildFaviconPng();

  console.log(
    "Built optimized images:",
    `1 hero webp + ${displayImages.length} display webp + ${downloadNames.length} download png + 1 favicon png`,
  );
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
