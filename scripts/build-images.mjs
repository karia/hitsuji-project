import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const rawDir = path.join(root, "raw/images");
const webpDir = path.join(root, "docs/assets/img");
const downloadsDir = path.join(root, "docs/assets/downloads");
const stickersDir = path.join(root, "docs/assets/effects/stickers");
const iconsDir = path.join(root, "docs/assets/icons");

const displayNames = ["key-visual", "message-board", "seat-map", "profile-mico", "profile-tsukaima"];
const downloadNames = ["profile-mico", "profile-tsukaima"];

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

const buildDisplayWebp = async (name) => {
  const inputPath = await resolveSource(name);
  const outputPath = path.join(webpDir, `${name}.webp`);
  await sharp(inputPath).webp({ quality: 82 }).toFile(outputPath);
};

const buildDownloadPng = async (name) => {
  const inputPath = await resolveSource(name);
  const outputPath = path.join(downloadsDir, `${name}.png`);
  await sharp(inputPath).png({ compressionLevel: 9 }).toFile(outputPath);
};

const listStickerNames = async () => {
  const entries = await fs.readdir(rawDir);
  return entries
    .map((entry) => {
      const match = entry.match(/^sticker-(\d{2})\.(png|jpg|jpeg)$/i);
      if (!match) return null;
      return { name: `sticker-${match[1]}`, order: Number(match[1]), file: entry };
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order)
    .map((item) => item.name);
};

const cleanDirByExt = async (dir, ext) => {
  const entries = await fs.readdir(dir);
  await Promise.all(
    entries
      .filter((entry) => entry.toLowerCase().endsWith(ext.toLowerCase()))
      .map((entry) => fs.unlink(path.join(dir, entry))),
  );
};

const buildStickerWebp = async (name) => {
  const inputPath = await resolveSource(name);
  const outputPath = path.join(stickersDir, `${name}.webp`);
  await sharp(inputPath).webp({ quality: 82 }).toFile(outputPath);
};

const buildFaviconPng = async () => {
  const inputPath = await resolveSource("sticker-14");
  const outputPath = path.join(iconsDir, "favicon.png");
  await sharp(inputPath)
    .resize(96, 96, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      withoutEnlargement: true,
    })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
};

const main = async () => {
  await Promise.all([
    ensureDir(webpDir),
    ensureDir(downloadsDir),
    ensureDir(stickersDir),
    ensureDir(iconsDir),
  ]);

  for (const name of displayNames) {
    await buildDisplayWebp(name);
  }

  for (const name of downloadNames) {
    await buildDownloadPng(name);
  }

  const stickerNames = await listStickerNames();
  await cleanDirByExt(stickersDir, ".webp");
  for (const name of stickerNames) {
    await buildStickerWebp(name);
  }

  await buildFaviconPng();

  console.log(
    "Built optimized images:",
    `${displayNames.length} webp + ${downloadNames.length} download png + ${stickerNames.length} sticker webp + 1 favicon png`,
  );
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
