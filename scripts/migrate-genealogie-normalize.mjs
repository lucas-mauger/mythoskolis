import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { load, dump } from "js-yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const sourcePath = resolve(projectRoot, "data/genealogie.yaml");
const targetPath = resolve(projectRoot, "data/genealogie.normalized.yaml");

function normalizeId(entity) {
  const slug = (entity.slug ?? entity.id ?? "").toString();
  const culture = (entity.culture ?? "grecque").toString().toLowerCase();
  return `${culture}-${slug}`;
}

async function main() {
  const yamlContent = await readFile(sourcePath, "utf-8");
  const data = load(yamlContent);

  const entities = (data?.entities ?? []).map((entity) => {
    const newId = normalizeId(entity);
    return {
      ...entity,
      id: newId,
    };
  });

  const idMap = new Map((data?.entities ?? []).map((entity) => [entity.id, normalizeId(entity)]));

  const relations = (data?.relations ?? []).map((relation) => ({
    ...relation,
    source_id: idMap.get(relation.source_id) ?? relation.source_id,
    target_id: idMap.get(relation.target_id) ?? relation.target_id,
  }));

  const normalized = { entities, relations };
  await writeFile(targetPath, dump(normalized, { lineWidth: -1 }), "utf-8");
  console.log(`✅ Fichier normalisé écrit dans ${targetPath}`);
}

main().catch((err) => {
  console.error("❌ Échec de la normalisation :", err);
  process.exit(1);
});
