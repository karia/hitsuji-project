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
  ["logo", "logo", 1000],
  ["emblem", "emblem", 360],
  ["enoshima", "enoshima", 1200],
  ["letter", "letter", 1200],
  ["sheep-letter", "sheep-letter", 480],
  ["sheep-build", "sheep-build", 480],
  ["sheep-wait", "sheep-wait", 480],
  ["sheep-swim", "sheep-swim", 480],
  ["toc-minecraft", "toc-minecraft", 1024],
  ["toc-download", "toc-download", 1024],
  ["toc-letter", "toc-letter", 1024],
  ["toc-special", "toc-special", 1024],
  ["toc-charlotte", "toc-charlotte", 1024],
  ["mc-ss-01", "mc-ss-01", 1280],
  ["mc-ss-02", "mc-ss-02", 1280],
  ["mc-ss-03", "mc-ss-03", 1280],
  ["mc-ss-04", "mc-ss-04", 1280],
  ["mc-ss-05", "mc-ss-05", 1280],
  ["mc-ss-06", "mc-ss-06", 1280],
  ["invite", "invite", 1280],
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

// ヒーローを背景・キャラの2レイヤーで出力（合成せず、CSSで重ねて順次フェードインするため）
const buildHeroLayers = async () => {
  const heroWidth = 1600;
  const backgroundPath = await resolveSource("background");
  await sharp(backgroundPath)
    .resize({ width: heroWidth, withoutEnlargement: true })
    .webp({ quality: 84 })
    .toFile(path.join(webpDir, "hero-bg.webp"));
  const keyVisualPath = await resolveSource("key-visual");
  await sharp(keyVisualPath)
    .ensureAlpha()
    .resize({ width: heroWidth, withoutEnlargement: true })
    .webp({ quality: 84 })
    .toFile(path.join(webpDir, "hero-char.webp"));
};

const buildDownloadPng = async (name) => {
  const inputPath = await resolveSource(name);
  const outputPath = path.join(downloadsDir, `${name}.png`);
  await sharp(inputPath).png({ compressionLevel: 9 }).toFile(outputPath);
};

const buildFaviconPng = async () => {
  const inputPath = await resolveSource("emblem");
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

  await buildHeroLayers();

  for (const [outName, srcName, maxWidth] of displayImages) {
    await buildDisplayWebp(outName, srcName, maxWidth);
  }

  for (const name of downloadNames) {
    await buildDownloadPng(name);
  }

  await buildFaviconPng();

  console.log(
    "Built optimized images:",
    `2 hero layer webp + ${displayImages.length} display webp + ${downloadNames.length} download png + 1 favicon png`,
  );
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
