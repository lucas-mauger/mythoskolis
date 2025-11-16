import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const yamlPath = resolve(projectRoot, "data/genealogie.yaml");
const outputPath = resolve(projectRoot, "public/data/genealogie.json");

async function generateJson() {
  const yamlContent = await readFile(yamlPath, "utf-8");
  const data = load(yamlContent);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`✅ Données généalogiques exportées vers ${outputPath}`);
}

generateJson().catch((error) => {
  console.error("❌ Impossible de générer genealogie.json :", error);
  process.exit(1);
});
