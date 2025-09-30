import { promises as fs } from "fs";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const projectRoot = join(__dirname, "..", "..");
const webglAssetsRoot = join(projectRoot, "webgl", "aquarium");
const webgpuAssetsRoot = join(projectRoot, "webgpu", "aquarium");

const directoriesToCopy = [
  { from: "assets", to: "assets" },
  { from: "static_assets", to: "static_assets" },
  { from: "source_assets", to: "source_assets" },
];

async function ensureDir(path) {
  await fs.mkdir(path, { recursive: true });
}

async function copyFile(src, dest) {
  await ensureDir(dirname(dest));
  await fs.copyFile(src, dest);
}

async function copyDirectory(fromDir, toDir) {
  const entries = await fs.readdir(fromDir, { withFileTypes: true });
  for (const entry of entries) {
    const src = join(fromDir, entry.name);
    const dest = join(toDir, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(src, dest);
    } else if (entry.isFile()) {
      await copyFile(src, dest);
    }
  }
}

async function main() {
  for (const { from, to } of directoriesToCopy) {
    const srcDir = join(webglAssetsRoot, from);
    const destDir = join(webgpuAssetsRoot, to);
    console.log(`Copying ${relative(projectRoot, srcDir)} -> ${relative(projectRoot, destDir)}`);
    await copyDirectory(srcDir, destDir);
  }
  console.log("Asset clone complete.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
