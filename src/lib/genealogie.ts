import { load } from "js-yaml";
import genealogieRaw from "../../data/genealogie.yaml?raw";
import { createGenealogieStore } from "./genealogie-shared";
import type {
  GenealogieData,
  GenealogieEntity,
  GraphDisplayData,
  RelationSource,
  RelationType,
  RelatedNode,
  GraphNodeCard,
  GraphSection,
  EgoGraph,
} from "./genealogie-shared";

const genealogieData = load(genealogieRaw) as GenealogieData;
const store = createGenealogieStore(genealogieData);

export { createGenealogieStore };
export type {
  GenealogieData,
  GenealogieEntity,
  RelationSource,
  RelationType,
  RelatedNode,
  GraphNodeCard,
  GraphSection,
  GraphDisplayData,
  EgoGraph,
};

export const getAllEntities = store.getAllEntities;
export const getEntityBySlug = store.getEntityBySlug;
export const getEgoGraph = store.getEgoGraphBySlug;
export const getGraphDisplayData = store.getGraphDisplayData;
export const getEgoGraphById = store.getEgoGraphById;
export const getEntityById = store.getEntityById;
