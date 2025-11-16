import {
  createGenealogieStore,
  type GenealogieData,
  type GenealogieStore,
  type RelationSource,
  type EgoGraph,
  type RelatedNode,
} from "../lib/genealogie-shared";

type NodeRole = "central" | "parent" | "child" | "sibling" | "consort";
type RingSection = keyof Pick<EgoGraph, "parents" | "children" | "siblings" | "consorts">;

interface LayoutNode {
  key: string;
  id: string;
  slug: string;
  name: string;
  relationLabel: string;
  role: NodeRole;
  x: number;
  y: number;
  tooltip?: string;
}

interface NodeInstance {
  el: HTMLElement;
  button: HTMLButtonElement;
  labelEl: HTMLElement;
}

const RELATION_LABELS: Record<NodeRole, string> = {
  central: "Centre",
  parent: "Parent",
  child: "Enfant",
  sibling: "Fratrie",
  consort: "Consort",
};

type RingConfig = {
  axis: "horizontal" | "vertical";
  role: NodeRole;
  spacing: number;
  offset?: number;
};

const RING_CONFIG: Record<RingSection, RingConfig> = {
  parents: { axis: "vertical", role: "parent", spacing: 130, offset: 0 },
  children: { axis: "vertical", role: "child", spacing: 130, offset: 0 },
  siblings: { axis: "vertical", role: "sibling", spacing: 140, offset: -320 },
  consorts: { axis: "vertical", role: "consort", spacing: 140, offset: 320 },
};

const COLUMN_FRACTIONS: Record<RingSection, number> = {
  parents: 0.2,
  siblings: 0.4,
  consorts: 0.6,
  children: 0.8,
};

const SECTION_BASE_Y: Record<RingSection | "central", number> = {
  parents: -150,
  siblings: -280,
  consorts: 280,
  children: 150,
  central: 0,
};

const SCROLL_ANCHOR = 1500;

export async function initEgoGraphInteractive(containerId: string, initialSlug: string) {
  const root = document.getElementById(containerId);
  if (!root) {
    return;
  }

  try {
    const response = await fetch("/data/genealogie.json");
    if (!response.ok) {
      throw new Error("Impossible de charger les données généalogiques");
    }

    const data = (await response.json()) as GenealogieData;
    const store = createGenealogieStore(data);
    const controller = new EgoGraphController(root, store);
    controller.setCurrentSlug(initialSlug);
    enableDragScroll(root);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    renderMessage(root, message);
    console.error(error);
  }
}

class EgoGraphController {
  private nodeInstances = new Map<string, NodeInstance>();
  private currentSlug: string | null = null;
  private messageEl: HTMLElement | null;
  private scaleY = 1;
  private columnOffsets = new Map<RingSection, number>();

  constructor(private root: HTMLElement, private store: GenealogieStore) {
    this.messageEl = this.root.querySelector(".ego-graph-message");
  }

  setCurrentSlug(slug: string) {
    const graph = this.store.getEgoGraph(slug);
    if (!graph) {
      this.showMessage("Pas encore de données pour ce dieu.");
      return;
    }

    this.currentSlug = slug;
    this.clearMessage();
    this.syncColumnOffsets();
    const layoutNodes = buildLayout(graph, this.columnOffsets);
    this.adjustContainerHeight(layoutNodes);
    this.updateScale();
    this.syncNodes(layoutNodes);
    this.centerOnRoot();
  }

  private syncNodes(layoutNodes: LayoutNode[]) {
    const nextKeys = new Set(layoutNodes.map((node) => node.key));

    layoutNodes.forEach((node) => {
      const instance = this.nodeInstances.get(node.key);
      if (instance) {
        this.updateNode(instance, node);
      } else {
        const newInstance = this.createNode(node);
        this.nodeInstances.set(node.key, newInstance);
        this.root.appendChild(newInstance.el);

        requestAnimationFrame(() => {
          newInstance.el.classList.add("is-visible");
        });
      }
    });

    this.nodeInstances.forEach((instance, key) => {
      if (!nextKeys.has(key)) {
        instance.el.classList.add("is-leaving");
        window.setTimeout(() => {
          instance.el.remove();
          const current = this.nodeInstances.get(key);
          if (current === instance) {
            this.nodeInstances.delete(key);
          }
        }, 220);
      }
    });
  }

  private createNode(node: LayoutNode): NodeInstance {
    const wrapper = document.createElement("div");
    wrapper.className = "ego-node";
    wrapper.dataset.role = node.role;
    wrapper.dataset.key = node.key;

    const button = document.createElement("button");
    button.type = "button";
    button.addEventListener("click", () => {
      if (node.role === "central" || node.slug === this.currentSlug) {
        return;
      }
      this.setCurrentSlug(node.slug);
    });

    const label = document.createElement("div");
    label.className = "ego-node-label";
    label.textContent = node.name;

    button.append(document.createElement("span"));
    wrapper.appendChild(button);
    wrapper.appendChild(label);

    const instance: NodeInstance = { el: wrapper, button, labelEl: label };
    this.updateNode(instance, node);
    return instance;
  }

  private updateNode(instance: NodeInstance, node: LayoutNode) {
    instance.el.dataset.role = node.role;
    instance.el.dataset.slug = node.slug;
    instance.el.dataset.baseY = String(node.y);
    instance.button.disabled = node.role === "central";
    instance.button.setAttribute("aria-label", `${node.name} — ${node.relationLabel}`);
    const faceUrl = getFaceUrl(node.slug);
    const gradient =
      node.role === "central"
        ? "linear-gradient(140deg, rgba(255,255,255,0.2), rgba(99,102,241,0.25))"
        : "linear-gradient(155deg, rgba(255,255,255,0.12), rgba(79,70,229,0.2))";
    instance.button.style.backgroundImage = `${gradient}, url(${faceUrl})`;
    instance.button.style.backgroundSize = "cover";
    instance.button.style.backgroundPosition = "center";
    instance.button.style.backgroundRepeat = "no-repeat";

    instance.labelEl.textContent = node.name;

    if (node.tooltip) {
      instance.button.title = node.tooltip;
    } else {
      instance.button.removeAttribute("title");
    }

    const scaledX = node.x;
    const scaledY = SCROLL_ANCHOR + node.y * this.scaleY;
    instance.el.style.transform = `translate(-50%, -50%) translate(${scaledX}px, ${scaledY}px)`;
  }

  private showMessage(text: string) {
    if (!this.messageEl) {
      this.messageEl = document.createElement("div");
      this.messageEl.className = "ego-graph-message";
      this.root.appendChild(this.messageEl);
    }
    this.messageEl.textContent = text;
  }

  private clearMessage() {
    if (this.messageEl) {
      this.messageEl.remove();
      this.messageEl = null;
    }
  }

  private updateScale() {
    this.scaleY = 1;
  }

  private adjustContainerHeight(_nodes: LayoutNode[]) {
    // hauteur contrôlée par le CSS, pas de recalcul
  }

  private centerOnRoot() {
    requestAnimationFrame(() => {
      const centerNode = this.root.querySelector<HTMLElement>('[data-role="central"]');
      if (!centerNode) {
        return;
      }
      const baseY = Number(centerNode.dataset.baseY ?? "0");
      const target = SCROLL_ANCHOR + baseY;
      const offset = target - this.root.clientHeight / 2 + centerNode.clientHeight / 2;
      this.root.scrollTop = Math.max(offset, 0);
    });
  }

  private syncColumnOffsets() {
    const rootRect = this.root.getBoundingClientRect();
    const fallback = computeFractionOffsets(rootRect.width);
    (["parents", "siblings", "consorts", "children"] as RingSection[]).forEach((section) => {
      const column = this.root.querySelector<HTMLElement>(`.ego-column[data-column="${section}"]`);
      if (column) {
        const rect = column.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        const rootCenter = rootRect.left + rootRect.width / 2;
        this.columnOffsets.set(section, center - rootCenter);
      } else {
        this.columnOffsets.set(section, fallback.get(section) ?? 0);
      }
    });
  }
}

function buildLayout(graph: EgoGraph, columnOffsets: Map<RingSection, number>): LayoutNode[] {
  const nodes: LayoutNode[] = [
    {
      key: `central-${graph.central.id}`,
      id: graph.central.id,
      slug: graph.central.slug,
      name: graph.central.name,
      relationLabel: RELATION_LABELS.central,
      role: "central",
      x: 0,
      y: SECTION_BASE_Y.central,
    },
  ];

  (Object.keys(RING_CONFIG) as RingSection[]).forEach((sectionKey) => {
    const sectionNodes = sortSection(graph[sectionKey] as RelatedNode[], sectionKey);
    const config = RING_CONFIG[sectionKey];
    const spacing = dynamicSpacing(config.spacing);

    sectionNodes.forEach((item, index) => {
      const tooltip = buildTooltip(item.relation.variant, item.relation.source_texts[0]);
      const coordinate = columnOffsets.get(sectionKey) ?? 0;
      const baseY = SECTION_BASE_Y[sectionKey];
      const y = SECTION_BASE_Y.central + config.offset! + index * spacing;
      const x = coordinate;
      nodes.push({
        key: `${sectionKey}-${item.entity.id}`,
        id: item.entity.id,
        slug: item.entity.slug,
        name: item.entity.name,
        relationLabel: RELATION_LABELS[config.role],
        role: config.role,
        tooltip,
        x,
        y,
      });
    });
  });

  return nodes;
}

function dynamicSpacing(base: number): number {
  return base;
}

function formatSource(source?: RelationSource): string | null {
  if (!source) {
    return null;
  }
  const note = source.note ? ` — ${source.note}` : "";
  return `${source.author}, ${source.work}${note}`;
}

function buildTooltip(variant?: string, source?: RelationSource): string | undefined {
  const parts: string[] = [];
  if (variant) {
    parts.push(`Variante : ${variant}`);
  }
  const formattedSource = formatSource(source);
  if (formattedSource) {
    parts.push(`Source : ${formattedSource}`);
  }
  return parts.length ? parts.join(" • ") : undefined;
}

function getFaceUrl(slug: string): string {
  return `/faces/${slug}.webp`;
}

function enableDragScroll(container: HTMLElement) {
  let isDragging = false;
  let startY = 0;
  let startScroll = 0;
  let activePointer: number | null = null;

  container.addEventListener("pointerdown", (event) => {
    const target = event.target as HTMLElement;
    if (target.closest(".ego-node button")) {
      return;
    }
    event.preventDefault();
    isDragging = true;
    startY = event.clientY;
    startScroll = container.scrollTop;
    activePointer = event.pointerId;
    container.setPointerCapture(event.pointerId);
    container.classList.add("is-dragging");
  });

  const stopDragging = (event: PointerEvent) => {
    if (!isDragging || (activePointer !== null && event.pointerId !== activePointer)) {
      return;
    }
    isDragging = false;
    activePointer = null;
    container.classList.remove("is-dragging");
    if (container.hasPointerCapture(event.pointerId)) {
      container.releasePointerCapture(event.pointerId);
    }
  };

  container.addEventListener("pointermove", (event) => {
    if (!isDragging || (activePointer !== null && event.pointerId !== activePointer)) {
      return;
    }
    event.preventDefault();
    const deltaY = event.clientY - startY;
    container.scrollTop = startScroll - deltaY;
  });

  container.addEventListener("pointerup", stopDragging);
  container.addEventListener("pointercancel", stopDragging);
}

function computeFractionOffsets(width: number): Map<RingSection, number> {
  const safeWidth = Math.max(width, 320);
  const offsets = new Map<RingSection, number>();
  (Object.keys(COLUMN_FRACTIONS) as RingSection[]).forEach((section) => {
    const fraction = COLUMN_FRACTIONS[section] - 0.5;
    offsets.set(section, fraction * safeWidth);
  });
  return offsets;
}

function sortSection(nodes: RelatedNode[], section: RingSection): RelatedNode[] {
  return nodes
    .slice()
    .sort((a, b) => a.entity.name.localeCompare(b.entity.name, "fr", { sensitivity: "base" }))
    .sort((a, b) => (a.entity.slug > b.entity.slug ? 1 : a.entity.slug < b.entity.slug ? -1 : 0));
}

function getLinkColor(role: NodeRole): string {
  switch (role) {
    case "parent":
      return "rgba(79, 70, 229, 0.7)";
    case "child":
      return "rgba(5, 150, 105, 0.6)";
    case "consort":
      return "rgba(236, 72, 153, 0.7)";
    case "sibling":
      return "rgba(6, 182, 212, 0.7)";
    default:
      return "rgba(129, 140, 248, 0.5)";
  }
}

function renderMessage(root: HTMLElement, text: string) {
  const message = document.createElement("div");
  message.className = "ego-graph-message";
  message.textContent = text;
  root.innerHTML = "";
  root.appendChild(message);
}

function bootFromDom() {
  document.querySelectorAll<HTMLElement>("[data-ego-graph]").forEach((element) => {
    if (element.dataset.graphHydrated === "true") {
      return;
    }

    const slug = element.dataset.initialSlug;
    const id = element.id;
    if (!slug || !id) {
      return;
    }

    initEgoGraphInteractive(id, slug);
    element.dataset.graphHydrated = "true";
  });
}

if (typeof window !== "undefined") {
  const start = () => bootFromDom();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}
