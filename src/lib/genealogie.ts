import { load } from "js-yaml";
import genealogieRaw from "../../data/genealogie.yaml?raw";

type RelationType = "parent" | "child" | "sibling" | "consort";

export interface GenealogieEntity {
  id: string;
  name: string;
  slug: string;
  culture: string;
}

export interface RelationSource {
  author: string;
  work: string;
  note?: string;
}

export interface GenealogieRelation {
  source_id: string;
  target_id: string;
  type: RelationType;
  variant?: string;
  source_texts: RelationSource[];
}

interface GenealogieData {
  entities: GenealogieEntity[];
  relations: GenealogieRelation[];
}

export interface RelatedNode {
  entity: GenealogieEntity;
  relation: GenealogieRelation;
}

export interface EgoGraph {
  central: GenealogieEntity;
  parents: RelatedNode[];
  children: RelatedNode[];
  siblings: RelatedNode[];
  consorts: RelatedNode[];
}

const genealogieData = load(genealogieRaw) as GenealogieData;
const entityById = new Map(genealogieData.entities.map((entity) => [entity.id, entity]));
const entityBySlug = new Map(genealogieData.entities.map((entity) => [entity.slug, entity]));

export function getAllEntities(): GenealogieEntity[] {
  return genealogieData.entities;
}

export function getEntityBySlug(slug: string): GenealogieEntity | undefined {
  return entityBySlug.get(slug);
}

function toRelatedNode(targetId: string, relation: GenealogieRelation): RelatedNode | undefined {
  const entity = entityById.get(targetId);
  if (!entity) {
    return undefined;
  }

  return { entity, relation };
}

export function getEgoGraph(slug: string): EgoGraph | undefined {
  const central = entityBySlug.get(slug);
  if (!central) {
    return undefined;
  }

  const parents = genealogieData.relations
    .filter((relation) => relation.type === "parent" && relation.target_id === central.id)
    .map((relation) => toRelatedNode(relation.source_id, relation))
    .filter(Boolean) as RelatedNode[];

  const children = genealogieData.relations
    .filter((relation) => relation.type === "parent" && relation.source_id === central.id)
    .map((relation) => toRelatedNode(relation.target_id, relation))
    .filter(Boolean) as RelatedNode[];

  const siblings = genealogieData.relations
    .filter(
      (relation) =>
        relation.type === "sibling" && (relation.source_id === central.id || relation.target_id === central.id),
    )
    .map((relation) => {
      const otherId = relation.source_id === central.id ? relation.target_id : relation.source_id;
      return toRelatedNode(otherId, relation);
    })
    .filter(Boolean) as RelatedNode[];

  const consorts = genealogieData.relations
    .filter(
      (relation) =>
        relation.type === "consort" && (relation.source_id === central.id || relation.target_id === central.id),
    )
    .map((relation) => {
      const otherId = relation.source_id === central.id ? relation.target_id : relation.source_id;
      return toRelatedNode(otherId, relation);
    })
    .filter(Boolean) as RelatedNode[];

  return {
    central,
    parents,
    children,
    siblings,
    consorts,
  };
}

export interface GraphNodeCard {
  id: string;
  name: string;
  slug: string;
  relationType: RelationType;
  variant?: string;
  sources: RelationSource[];
}

export interface GraphSection {
  id: "parents" | "children" | "siblings" | "consorts";
  title: string;
  nodes: GraphNodeCard[];
}

export interface GraphDisplayData {
  central: GenealogieEntity;
  sections: GraphSection[];
}

function mapRelatedNodes(nodes: RelatedNode[]): GraphNodeCard[] {
  return nodes.map(({ entity, relation }) => ({
    id: entity.id,
    name: entity.name,
    slug: entity.slug,
    relationType: relation.type,
    variant: relation.variant,
    sources: relation.source_texts,
  }));
}

export function getGraphDisplayData(slug: string): GraphDisplayData | undefined {
  const graph = getEgoGraph(slug);
  if (!graph) {
    return undefined;
  }

  return {
    central: graph.central,
    sections: [
      { id: "parents", title: "Parents", nodes: mapRelatedNodes(graph.parents) },
      { id: "siblings", title: "Fratrie", nodes: mapRelatedNodes(graph.siblings) },
      { id: "consorts", title: "Consorts", nodes: mapRelatedNodes(graph.consorts) },
      { id: "children", title: "Enfants", nodes: mapRelatedNodes(graph.children) },
    ],
  };
}
