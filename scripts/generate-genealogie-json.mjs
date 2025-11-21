import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const yamlPath = resolve(projectRoot, "data/genealogie.yaml");
const outputPath = resolve(projectRoot, "public/data/genealogie.json");

function normalizeEntity(entity) {
  const slug = (entity.slug ?? entity.id ?? "").toString();
  const culture = (entity.culture ?? "grecque").toString().toLowerCase();
  const legacyId = entity.id ?? slug;
  const normalizedId = `${culture}-${slug}`;
  return {
    ...entity,
    id: legacyId,
    slug,
    culture,
    normalized_id: normalizedId,
  };
}

function normalizeRelation(relation) {
  return {
    ...relation,
    source_normalized_id: relation.source_id,
    target_normalized_id: relation.target_id,
  };
}

async function generateJson() {
  const yamlContent = await readFile(yamlPath, "utf-8");
  const data = load(yamlContent);

  const entities = Array.isArray(data?.entities) ? data.entities.map(normalizeEntity) : [];
  const relations = Array.isArray(data?.relations) ? data.relations.map(normalizeRelation) : [];

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    JSON.stringify(
      {
        entities,
        relations,
      },
      null,
      2,
    ),
    "utf-8",
  );
  console.log(`✅ Données généalogiques exportées vers ${outputPath}`);
}

generateJson().catch((error) => {
  console.error("❌ Impossible de générer genealogie.json :", error);
  process.exit(1);
});
