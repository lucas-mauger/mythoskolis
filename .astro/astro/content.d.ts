declare module 'astro:content' {
	interface RenderResult {
		Content: import('astro/runtime/server/index.js').AstroComponentFactory;
		headings: import('astro').MarkdownHeading[];
		remarkPluginFrontmatter: Record<string, any>;
	}
	interface Render {
		'.md': Promise<RenderResult>;
	}

	export interface RenderedContent {
		html: string;
		metadata?: {
			imagePaths: Array<string>;
			[key: string]: unknown;
		};
	}
}

declare module 'astro:content' {
	type Flatten<T> = T extends { [K: string]: infer U } ? U : never;

	export type CollectionKey = keyof AnyEntryMap;
	export type CollectionEntry<C extends CollectionKey> = Flatten<AnyEntryMap[C]>;

	export type ContentCollectionKey = keyof ContentEntryMap;
	export type DataCollectionKey = keyof DataEntryMap;

	type AllValuesOf<T> = T extends any ? T[keyof T] : never;
	type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
		ContentEntryMap[C]
	>['slug'];

	/** @deprecated Use `getEntry` instead. */
	export function getEntryBySlug<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		// Note that this has to accept a regular string too, for SSR
		entrySlug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;

	/** @deprecated Use `getEntry` instead. */
	export function getDataEntryById<C extends keyof DataEntryMap, E extends keyof DataEntryMap[C]>(
		collection: C,
		entryId: E,
	): Promise<CollectionEntry<C>>;

	export function getCollection<C extends keyof AnyEntryMap, E extends CollectionEntry<C>>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => entry is E,
	): Promise<E[]>;
	export function getCollection<C extends keyof AnyEntryMap>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => unknown,
	): Promise<CollectionEntry<C>[]>;

	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(entry: {
		collection: C;
		slug: E;
	}): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(entry: {
		collection: C;
		id: E;
	}): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		slug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(
		collection: C,
		id: E,
	): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;

	/** Resolve an array of entry references from the same collection */
	export function getEntries<C extends keyof ContentEntryMap>(
		entries: {
			collection: C;
			slug: ValidContentEntrySlug<C>;
		}[],
	): Promise<CollectionEntry<C>[]>;
	export function getEntries<C extends keyof DataEntryMap>(
		entries: {
			collection: C;
			id: keyof DataEntryMap[C];
		}[],
	): Promise<CollectionEntry<C>[]>;

	export function render<C extends keyof AnyEntryMap>(
		entry: AnyEntryMap[C][string],
	): Promise<RenderResult>;

	export function reference<C extends keyof AnyEntryMap>(
		collection: C,
	): import('astro/zod').ZodEffects<
		import('astro/zod').ZodString,
		C extends keyof ContentEntryMap
			? {
					collection: C;
					slug: ValidContentEntrySlug<C>;
				}
			: {
					collection: C;
					id: keyof DataEntryMap[C];
				}
	>;
	// Allow generic `string` to avoid excessive type errors in the config
	// if `dev` is not running to update as you edit.
	// Invalid collection names will be caught at build time.
	export function reference<C extends string>(
		collection: C,
	): import('astro/zod').ZodEffects<import('astro/zod').ZodString, never>;

	type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
	type InferEntrySchema<C extends keyof AnyEntryMap> = import('astro/zod').infer<
		ReturnTypeOrOriginal<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type ContentEntryMap = {
		"dieux": {
"aphrodite.md": {
	id: "aphrodite.md";
  slug: "aphrodite";
  body: string;
  collection: "dieux";
  data: any
} & { render(): Render[".md"] };
"apollon.md": {
	id: "apollon.md";
  slug: "apollon";
  body: string;
  collection: "dieux";
  data: any
} & { render(): Render[".md"] };
"ares.md": {
	id: "ares.md";
  slug: "ares";
  body: string;
  collection: "dieux";
  data: any
} & { render(): Render[".md"] };
"artemis.md": {
	id: "artemis.md";
  slug: "artemis";
  body: string;
  collection: "dieux";
  data: any
} & { render(): Render[".md"] };
"athena.md": {
	id: "athena.md";
  slug: "athena";
  body: string;
  collection: "dieux";
  data: any
} & { render(): Render[".md"] };
"demeter.md": {
	id: "demeter.md";
  slug: "demeter";
  body: string;
  collection: "dieux";
  data: any
} & { render(): Render[".md"] };
"dionysos.md": {
	id: "dionysos.md";
  slug: "dionysos";
  body: string;
  collection: "dieux";
  data: any
} & { render(): Render[".md"] };
"hades.md": {
	id: "hades.md";
  slug: "hades";
  body: string;
  collection: "dieux";
  data: any
} & { render(): Render[".md"] };
"hebe.md": {
	id: "hebe.md";
  slug: "hebe";
  body: string;
  collection: "dieux";
  data: any
} & { render(): Render[".md"] };
"hephaistos.md": {
	id: "hephaistos.md";
  slug: "hephaistos";
  body: string;
  collection: "dieux";
  data: any
} & { render(): Render[".md"] };
"hera.md": {
	id: "hera.md";
  slug: "hera";
  body: string;
  collection: "dieux";
  data: any
} & { render(): Render[".md"] };
"hermes.md": {
	id: "hermes.md";
  slug: "hermes";
  body: string;
  collection: "dieux";
  data: any
} & { render(): Render[".md"] };
"hestia.md": {
	id: "hestia.md";
  slug: "hestia";
  body: string;
  collection: "dieux";
  data: any
} & { render(): Render[".md"] };
"leto.md": {
	id: "leto.md";
  slug: "leto";
  body: string;
  collection: "dieux";
  data: any
} & { render(): Render[".md"] };
"maia.md": {
	id: "maia.md";
  slug: "maia";
  body: string;
  collection: "dieux";
  data: any
} & { render(): Render[".md"] };
"metis.md": {
	id: "metis.md";
  slug: "metis";
  body: string;
  collection: "dieux";
  data: any
} & { render(): Render[".md"] };
"persephone.md": {
	id: "persephone.md";
  slug: "persephone";
  body: string;
  collection: "dieux";
  data: any
} & { render(): Render[".md"] };
"poseidon.md": {
	id: "poseidon.md";
  slug: "poseidon";
  body: string;
  collection: "dieux";
  data: any
} & { render(): Render[".md"] };
"semele.md": {
	id: "semele.md";
  slug: "semele";
  body: string;
  collection: "dieux";
  data: any
} & { render(): Render[".md"] };
"zeus.md": {
	id: "zeus.md";
  slug: "zeus";
  body: string;
  collection: "dieux";
  data: any
} & { render(): Render[".md"] };
};

	};

	type DataEntryMap = {
		
	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	export type ContentConfig = never;
}
