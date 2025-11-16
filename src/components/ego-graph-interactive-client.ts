import {
  createGenealogieStore,
  type GenealogieData,
  type GenealogieStore,
  type EgoGraph,
  type RelatedNode,
} from "../lib/genealogie-shared";

type NodeRole = "central" | "parent" | "child" | "sibling" | "consort";
type RelationSection = "parents" | "siblings" | "consorts" | "children";

interface NodeSpec {
  key: string;
  slug: string;
  name: string;
  relationLabel: string;
  role: NodeRole;
}

const RELATION_LABELS: Record<NodeRole, string> = {
  central: "Centre",
  parent: "Parent",
  child: "Enfant",
  sibling: "Fratrie",
  consort: "Consort",
};

const SECTION_ROLE: Record<RelationSection, NodeRole> = {
  parents: "parent",
  siblings: "sibling",
  consorts: "consort",
  children: "child",
};

const RELATION_SECTIONS: RelationSection[] = ["parents", "siblings", "consorts", "children"];

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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    renderMessage(root, message);
    console.error(error);
  }
}

class EgoGraphController {
  private currentSlug: string | null = null;
  private messageEl: HTMLElement | null;
  private sectionContainers = new Map<RelationSection, HTMLElement>();

  constructor(private root: HTMLElement, private store: GenealogieStore) {
    this.messageEl = this.root.querySelector(".ego-graph-message");
    RELATION_SECTIONS.forEach((section) => {
      const container = this.root.querySelector<HTMLElement>(`[data-section="${section}"]`);
      if (container) {
        this.sectionContainers.set(section, container);
        enableQuadrantDragScroll(container);
        monitorScrollable(container);
      }
    });
  }

  setCurrentSlug(slug: string) {
    const graph = this.store.getEgoGraph(slug);
    if (!graph) {
      this.showMessage("Pas encore de données pour ce dieu.");
      return;
    }

    this.currentSlug = slug;
    this.clearMessage();
    this.renderGraph(graph);
  }

  private renderGraph(graph: EgoGraph) {
    this.clearNodes();

    const centralNode = this.createNode({
      key: `central-${graph.central.id}`,
      slug: graph.central.slug,
      name: graph.central.name,
      role: "central",
      relationLabel: RELATION_LABELS.central,
    });
    this.root.appendChild(centralNode);
    requestAnimationFrame(() => centralNode.classList.add("is-visible"));

    RELATION_SECTIONS.forEach((section) => {
      const container = this.sectionContainers.get(section);
      if (!container) {
        return;
      }
      container.innerHTML = "";
      const nodes = sortSection(graph[section] as RelatedNode[]);
      nodes.forEach((item) => {
        const node = this.createNode({
          key: `${section}-${item.entity.id}`,
          slug: item.entity.slug,
          name: item.entity.name,
          role: SECTION_ROLE[section],
          relationLabel: RELATION_LABELS[SECTION_ROLE[section]],
        });
        container.appendChild(node);
        requestAnimationFrame(() => node.classList.add("is-visible"));
      });
      container.dispatchEvent(new Event("scroll")); // refresh indicators
      container.classList.toggle("has-content", nodes.length > 0);
    });
  }

  private clearNodes() {
    this.root.querySelectorAll(".ego-node").forEach((node) => node.remove());
  }

  private createNode(node: NodeSpec): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "ego-node";
    wrapper.dataset.role = node.role;
    wrapper.dataset.slug = node.slug;

    const button = document.createElement("button");
    button.type = "button";
    button.disabled = node.role === "central";
    button.setAttribute("aria-label", `${node.name} — ${node.relationLabel}`);

    if (node.role !== "central") {
      button.addEventListener("click", () => {
        if (node.slug === this.currentSlug) {
          return;
        }
        this.setCurrentSlug(node.slug);
      });
    }

    const faceUrl = getFaceUrl(node.slug);
    const gradient =
      node.role === "central"
        ? "linear-gradient(140deg, rgba(255,255,255,0.2), rgba(99,102,241,0.25))"
        : "linear-gradient(155deg, rgba(255,255,255,0.12), rgba(79,70,229,0.2))";
    button.style.backgroundImage = `${gradient}, url(${faceUrl})`;
    button.style.backgroundSize = "cover";
    button.style.backgroundPosition = "center";
    button.style.backgroundRepeat = "no-repeat";

    const filler = document.createElement("span");
    button.append(filler);

    const label = document.createElement("div");
    label.className = "ego-node-label";
    label.textContent = node.name;

    wrapper.appendChild(button);
    wrapper.appendChild(label);
    return wrapper;
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
}

function getFaceUrl(slug: string): string {
  return `/faces/${slug}.webp`;
}

function sortSection(nodes: RelatedNode[]): RelatedNode[] {
  return nodes
    .slice()
    .sort((a, b) => a.entity.name.localeCompare(b.entity.name, "fr", { sensitivity: "base" }));
}

function enableQuadrantDragScroll(container: HTMLElement) {
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

function monitorScrollable(container: HTMLElement) {
  const update = () => {
    const atTop = container.scrollTop <= 2;
    const atBottom = container.scrollHeight - container.clientHeight - container.scrollTop <= 2;
    container.classList.toggle("has-more-top", !atTop);
    container.classList.toggle("has-more-bottom", !atBottom);
  };
  container.addEventListener("scroll", update);
  const resizeObserver = new ResizeObserver(update);
  resizeObserver.observe(container);
  update();
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
    if (!slug) {
      return;
    }
    element.dataset.graphHydrated = "true";
    initEgoGraphInteractive(element.id, slug);
  });
}

bootFromDom();
