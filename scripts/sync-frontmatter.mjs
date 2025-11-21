import { readFile, writeFile, readdir } from "node:fs/promises";
import { resolve, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import matter from "gray-matter";
import { load as loadYaml } from "js-yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const yamlPath = resolve(root, "data/genealogie.yaml");
const entitiesDir = resolve(root, "src/content/entites");

async function loadYamlEntities() {
  const raw = await readFile(yamlPath, "utf-8");
  const data = loadYaml(raw) ?? {};
  const map = new Map();
  for (const entity of data.entities ?? []) {
    if (!entity?.id) continue;
    map.set(`${entity.id}`, {
      id: `${entity.id}`,
      culture: entity.culture ? `${entity.culture}` : "",
    });
  }
  return map;
}

function buildFrontmatter(originalData, normalized) {
  const ordered = {};
  const replaceKeys = ["id", "culture"];
  const seen = new Set();

  for (const key of Object.keys(originalData)) {
    if (replaceKeys.includes(key)) {
      ordered[key] = normalized[key];
      seen.add(key);
    } else {
      ordered[key] = originalData[key];
    }
  }

  for (const key of replaceKeys) {
    if (!seen.has(key)) {
      ordered[key] = normalized[key];
    }
  }

  return ordered;
}

async function syncFrontmatter(map) {
  const entries = await readdir(entitiesDir, { withFileTypes: true });
  const mdFiles = entries.filter((f) => f.isFile() && extname(f.name) === ".md");
  const updated = [];
  const missing = [];

  for (const file of mdFiles) {
    const filePath = resolve(entitiesDir, file.name);
    const raw = await readFile(filePath, "utf-8");
    const parsed = matter(raw);
    const currentId = parsed.data?.id ? `${parsed.data.id}` : "";
    const source = map.get(currentId);

    if (!source) {
      missing.push({ file: file.name, id: currentId });
      continue;
    }

    const nextData = buildFrontmatter(parsed.data ?? {}, {
      id: source.id,
      culture: source.culture,
    });
    const nextContent = matter.stringify(parsed.content, nextData, { lineWidth: 0 });

    if (nextContent !== raw) {
      await writeFile(filePath, nextContent, "utf-8");
      updated.push(file.name);
    }
  }

  return { updated, missing };
}

async function run() {
  const map = await loadYamlEntities();
  const { updated, missing } = await syncFrontmatter(map);

  if (updated.length) {
    console.log(`✅ Frontmatters synchronisés (${updated.length}) :`);
    updated.forEach((name) => console.log(` - ${name}`));
  } else {
    console.log("✅ Frontmatters déjà à jour.");
  }

  if (missing.length) {
    console.warn("⚠️ Entrées sans correspondance YAML :");
    missing.forEach((item) => console.warn(` - ${item.file} (id: ${item.id || "absent"})`));
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("❌ Erreur durant la synchronisation :", error);
  process.exit(1);
});
