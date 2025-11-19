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
  isMuted?: boolean;
  isRelatedChild?: boolean;
  isRelatedConsort?: boolean;
  isSibling?: boolean;
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
    controller.setCurrentSlug(initialSlug).catch((err) => console.error(err));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    renderMessage(root, message);
    console.error(error);
  }
}

class EgoGraphController {
  private currentSlug: string | null = null;
  private currentGraph: EgoGraph | null = null;
  private focusedConsortSlug: string | null = null;
  private selectedConsortSlug: string | null = null;
  private focusedChildSlug: string | null = null;
  private activeNodeKey: string | null = null;
  private childrenOrder: string[] | null = null;
  private consortOrder: string[] | null = null;
  private messageEl: HTMLElement | null;
  private nodeInstances = new Map<string, HTMLElement>();
  private sectionContainers = new Map<RelationSection, HTMLElement>();
  private sectionScrollTops = new Map<RelationSection, number>();

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

    this.root.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".ego-node")) {
        this.clearActiveNode();
        this.selectedConsortSlug = null;
        this.focusedConsortSlug = null;
        this.focusedChildSlug = null;
        this.consortOrder = null;
        if (this.currentGraph) {
          this.renderGraph(this.currentGraph);
        }
      }
      if (this.selectedConsortSlug) {
        if (target.closest('.ego-node[data-role="consort"]')) {
          return;
        }
        this.selectedConsortSlug = null;
        this.focusedConsortSlug = null;
        if (this.currentGraph) {
          this.renderGraph(this.currentGraph);
        }
      }
    });

  }

  async setCurrentSlug(slug: string) {
    const graph = this.store.getEgoGraph(slug);
    if (!graph) {
      this.showMessage("Pas encore de données pour ce dieu.");
      return;
    }

    this.currentSlug = slug;
    this.currentGraph = graph;
    this.selectedConsortSlug = null;
    this.focusedConsortSlug = null;
    this.childrenOrder = null;
    this.consortOrder = null;
    this.activeNodeKey = null;
    this.sectionScrollTops.clear();
    this.clearMessage();
    await this.renderGraph(graph);
  }

  private async renderGraph(graph: EgoGraph) {
    this.captureScrollTops();
    this.clearNodes();

    const centralNode = this.createNode({
      key: `central-${graph.central.id}`,
      slug: graph.central.slug,
      name: graph.central.name,
      role: "central",
      relationLabel: RELATION_LABELS.central,
      isRelatedConsort: this.focusedChildSlug !== null,
    });
    this.root.appendChild(centralNode);
    requestAnimationFrame(() => centralNode.classList.add("is-visible"));

    RELATION_SECTIONS.forEach((section) => {
      const container = this.sectionContainers.get(section);
      if (!container) {
        return;
      }
      const prevScroll = this.sectionScrollTops.get(section) ?? container.scrollTop;
      const shouldResetScroll =
        section === "consorts" &&
        this.focusedChildSlug !== null &&
        (graph.consorts ?? []).some((c) => this.store.hasParent(this.focusedChildSlug!, c.entity.slug));
      const shouldResetChildren =
        section === "children" &&
        this.focusedConsortSlug !== null &&
        (graph.children ?? []).some((child) => this.store.hasParent(child.entity.slug, this.focusedConsortSlug!));
      const restoreScroll = shouldResetScroll || shouldResetChildren ? 0 : prevScroll;
      container.innerHTML = "";
      const isMobile = window.matchMedia("(max-width: 640px)").matches;
      const baseColumns = isMobile ? 2 : 3;
      let columns = baseColumns;
      let index = 0;
      let nodes = sortSection(graph[section] as RelatedNode[]);
      const isCompactParents = section === "parents" && nodes.length > 0 && nodes.length <= 2;
      container.classList.toggle("is-compact-parents", isCompactParents);
      if (isCompactParents) {
        columns = isMobile ? 1 : Math.min(2, nodes.length);
      }
      if (section === "children" && this.childrenOrder && this.childrenOrder.length) {
        nodes = sortByOrder(nodes, this.childrenOrder);
      }
      if (section === "children") {
        if (this.focusedConsortSlug) {
          const { prioritized, rest } = prioritizeChildren(nodes, this.focusedConsortSlug, this.store);
          nodes = [...prioritized, ...rest];
          this.childrenOrder = nodes.map((n) => n.entity.slug);
        } else if (this.focusedChildSlug) {
          nodes = reorderSiblings(nodes, this.focusedChildSlug, graph.consorts, this.store);
          this.childrenOrder = nodes.map((n) => n.entity.slug);
        } else if (this.childrenOrder && this.childrenOrder.length) {
          nodes = sortByOrder(nodes, this.childrenOrder);
        }
      } else if (section === "consorts") {
        if (this.consortOrder && this.consortOrder.length) {
          nodes = sortByOrder(nodes, this.consortOrder);
        }
        if (this.focusedChildSlug) {
          const { prioritized, rest } = prioritizeConsorts(nodes, this.focusedChildSlug, this.store);
          nodes = [...prioritized, ...rest];
          this.consortOrder = nodes.map((n) => n.entity.slug);
        }
      }
      nodes.forEach((item) => {
        const isConsort = SECTION_ROLE[section] === "consort";
        const isChild = SECTION_ROLE[section] === "child";
        const isRelatedChild =
          isChild && this.focusedConsortSlug !== null && this.store.hasParent(item.entity.slug, this.focusedConsortSlug);
        const isRelatedConsort =
          isConsort && this.focusedChildSlug !== null && this.store.hasParent(this.focusedChildSlug, item.entity.slug);
        const isSibling =
          isChild &&
          this.focusedChildSlug !== null &&
          this.isSiblingOfFocused(item.entity.slug, this.focusedChildSlug, graph.consorts);
        const isMuted =
          (isConsort && this.selectedConsortSlug && this.selectedConsortSlug !== item.entity.slug) ||
          (isConsort &&
            this.focusedChildSlug !== null &&
            !this.store.hasParent(this.focusedChildSlug, item.entity.slug)) ||
          (isChild &&
            this.focusedConsortSlug !== null &&
            !this.store.hasParent(item.entity.slug, this.focusedConsortSlug)) ||
          (isChild &&
            this.focusedChildSlug !== null &&
            !this.isSiblingOfFocused(item.entity.slug, this.focusedChildSlug, graph.consorts) &&
            item.entity.slug !== this.focusedChildSlug);
        const node = this.createNode({
          key: `${section}-${item.entity.id}`,
          slug: item.entity.slug,
          name: item.entity.name,
          role: SECTION_ROLE[section],
          relationLabel: RELATION_LABELS[SECTION_ROLE[section]],
          isMuted,
          isRelatedChild,
          isRelatedConsort,
          isSibling,
        });
        const row = Math.floor(index / columns) + 1;
        const col = (index % columns) + 1;
        node.style.gridRowStart = String(row);
        node.style.gridColumnStart = String(col);
        index += 1;
        container.appendChild(node);
        requestAnimationFrame(() => node.classList.add("is-visible"));
      });
      container.dispatchEvent(new Event("scroll")); // refresh indicators
      container.classList.toggle("has-content", nodes.length > 0);
      // Restore scroll position to avoid jump-to-top
      requestAnimationFrame(() => {
        container.scrollTop = restoreScroll;
      });
    });

    if (this.activeNodeKey) {
      this.setActiveNode(this.activeNodeKey);
    }
  }

  private clearNodes() {
    this.root.querySelectorAll(".ego-node").forEach((node) => node.remove());
    this.nodeInstances.clear();
  }

  private captureScrollTops() {
    RELATION_SECTIONS.forEach((section) => {
      const container = this.sectionContainers.get(section);
      if (container) {
        this.sectionScrollTops.set(section, container.scrollTop);
      }
    });
  }

  private createNode(node: NodeSpec): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "ego-node";
    wrapper.dataset.role = node.role;
    wrapper.dataset.slug = node.slug;
    if (node.isMuted) {
      wrapper.classList.add("is-muted");
    }
    if (node.isRelatedChild) {
      wrapper.classList.add("is-related");
    }
    if (node.isRelatedConsort) {
      wrapper.classList.add("is-related");
    }
    if (node.isSibling) {
      wrapper.classList.add("is-sibling");
    }

    const button = document.createElement("button");
    button.type = "button";
    button.disabled = false;
    button.setAttribute("aria-label", `${node.name} — ${node.relationLabel}`);

    button.addEventListener("click", async () => {
      const isSecondClick = this.activeNodeKey === node.key;
      this.setActiveNode(node.key);

      if (node.role === "consort") {
        const currentOrder = this.getSectionOrder("consorts");
        if (currentOrder.length) {
          this.consortOrder = currentOrder;
        }
        this.selectedConsortSlug = node.slug;
        this.focusedConsortSlug = node.slug;
        this.focusedChildSlug = null;
        if (isSecondClick && node.slug !== this.currentSlug) {
          this.resetFocusState();
          const targets = this.computeTargetPositions(node.slug);
          await Promise.all([
            this.animateToCenter(wrapper),
            targets ? this.animateOtherNodes(targets, node.slug) : Promise.resolve(),
          ]);
          await this.setCurrentSlug(node.slug);
          return;
        }
        if (this.currentGraph && this.currentSlug) {
          await this.renderGraph(this.currentGraph);
        }
      } else if (node.role !== "central") {
        if (node.role === "child") {
          const currentOrder = this.getSectionOrder("children");
          if (currentOrder.length) {
            this.childrenOrder = currentOrder;
          }
          const consortOrder = this.getSectionOrder("consorts");
          if (consortOrder.length) {
            this.consortOrder = consortOrder;
          }
          this.focusedChildSlug = node.slug;
          this.selectedConsortSlug = null;
          this.focusedConsortSlug = null;
          if (isSecondClick && node.slug !== this.currentSlug) {
            this.resetFocusState();
            const targets = this.computeTargetPositions(node.slug);
            await Promise.all([
              this.animateToCenter(wrapper),
              targets ? this.animateOtherNodes(targets, node.slug) : Promise.resolve(),
            ]);
            await this.setCurrentSlug(node.slug);
            return;
          }
          if (this.currentGraph) {
            await this.renderGraph(this.currentGraph);
          }
        } else if (isSecondClick && node.slug !== this.currentSlug) {
          this.resetFocusState();
          const targets = this.computeTargetPositions(node.slug);
          await Promise.all([
            this.animateToCenter(wrapper),
            targets ? this.animateOtherNodes(targets, node.slug) : Promise.resolve(),
          ]);
          await this.setCurrentSlug(node.slug);
        } else {
          // Parent or sibling first click: clear previous child-related focus/halos.
          this.focusedChildSlug = null;
          this.focusedConsortSlug = null;
          this.selectedConsortSlug = null;
          if (this.currentGraph) {
            await this.renderGraph(this.currentGraph);
          }
        }
      } else {
        // Clicking the central node clears related halos/focus states but keeps central active/displayed
        this.focusedChildSlug = null;
        this.focusedConsortSlug = null;
        this.selectedConsortSlug = null;
        this.childrenOrder = null;
        this.consortOrder = null;
        if (this.currentGraph) {
          await this.renderGraph(this.currentGraph);
          this.setActiveNode(node.key);
        }
      }
    });

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

    if (node.role === "central") {
      const action = document.createElement("div");
      action.className = "ego-node-action";
      action.textContent = "Aller à la fiche";
      action.addEventListener("click", (event) => {
        event.stopPropagation();
        window.location.href = `/entites/${node.slug}/`;
      });
      wrapper.appendChild(action);
    }

    wrapper.appendChild(button);
    wrapper.appendChild(label);
    this.nodeInstances.set(node.key, wrapper);
    return wrapper;
  }

  private setActiveNode(key: string | null) {
    this.activeNodeKey = key;
    this.nodeInstances.forEach((el, nodeKey) => {
      el.classList.toggle("is-active", key !== null && nodeKey === key);
    });
    if (key === null) {
      return;
    }
  }

  private clearActiveNode() {
    this.setActiveNode(null);
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

  private getSectionOrder(section: RelationSection): string[] {
    const container = this.sectionContainers.get(section);
    if (!container) return [];
    return Array.from(container.querySelectorAll<HTMLElement>(".ego-node"))
      .map((el) => el.dataset.slug)
      .filter((slug): slug is string => Boolean(slug));
  }

  private isSiblingOfFocused(childSlug: string, focusedChildSlug: string, consorts: RelatedNode[]): boolean {
    if (childSlug === focusedChildSlug) return false;
    const parentConsorts = consorts
      .filter((consort) => this.store.hasParent(focusedChildSlug, consort.entity.slug))
      .map((c) => c.entity.slug);
    if (!parentConsorts.length) return false;
    return parentConsorts.some((parentSlug) => this.store.hasParent(childSlug, parentSlug));
  }

  private async animateToCenter(nodeEl: HTMLElement): Promise<void> {
    // Suspend active glow during animation
    nodeEl.classList.remove("is-active");
    nodeEl.classList.remove("is-related");
    nodeEl.classList.remove("is-sibling");
    const originalLabel = nodeEl.querySelector<HTMLElement>(".ego-node-label");
    if (originalLabel) {
      originalLabel.style.visibility = "hidden";
    }
    const sourceRect = nodeEl.getBoundingClientRect();
    const rootRect = this.root.getBoundingClientRect();
    const targetNode = this.root.querySelector<HTMLElement>('.ego-node[data-role="central"]');
    const targetRect = targetNode?.getBoundingClientRect() ?? {
      left: rootRect.left + rootRect.width / 2 - sourceRect.width / 2,
      top: rootRect.top + rootRect.height / 2 - sourceRect.height / 2,
      width: sourceRect.width * 2,
      height: sourceRect.height * 2,
    };

    const clone = nodeEl.cloneNode(true) as HTMLElement;
    clone.classList.add("ego-node-fly");
    clone.classList.remove("is-active", "is-related", "is-sibling");
    clone.querySelector(".ego-node-label")?.remove();
    clone.style.position = "fixed";
    clone.style.left = `${sourceRect.left}px`;
    clone.style.top = `${sourceRect.top}px`;
    clone.style.width = `${sourceRect.width}px`;
    clone.style.height = `${sourceRect.height}px`;
    clone.style.transformOrigin = "center center";
    clone.style.zIndex = "9999";
    clone.style.pointerEvents = "none";

    document.body.appendChild(clone);

    // Hide original during flight
    nodeEl.classList.add("is-animating");
    nodeEl.style.opacity = "0";

    const dx = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
    const dy = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);
    const scale = targetRect.width / sourceRect.width;

    // Force reflow then animate
    void clone.getBoundingClientRect();
    clone.style.transition = "transform 450ms ease, opacity 450ms ease";
    clone.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;

    await new Promise<void>((resolve) => {
      const done = () => {
        clone.remove();
        nodeEl.classList.remove("is-animating");
        nodeEl.style.opacity = "";
        if (originalLabel) {
          originalLabel.style.visibility = "";
        }
        resolve();
      };
      const timeout = window.setTimeout(done, 600);
      clone.addEventListener(
        "transitionend",
        () => {
          window.clearTimeout(timeout);
          done();
        },
        { once: true },
      );
    });
  }

  private resetFocusState() {
    this.selectedConsortSlug = null;
    this.focusedConsortSlug = null;
    this.focusedChildSlug = null;
    this.childrenOrder = null;
    this.consortOrder = null;
    this.clearActiveNode();
  }

  private async animateOtherNodes(targetPositions: Map<string, DOMRect>, excludeSlug: string): Promise<void> {
    const animations: Promise<void>[] = [];
    this.nodeInstances.forEach((el) => {
      const slug = el.dataset.slug;
      if (!slug || slug === excludeSlug) return;
      const target = targetPositions.get(slug);
      if (!target) return;
      animations.push(this.animateNodeTo(el, target));
    });
    if (animations.length) {
      await Promise.all(animations);
    }
  }

  private async animateNodeTo(nodeEl: HTMLElement, targetRect: DOMRect): Promise<void> {
    nodeEl.classList.remove("is-active");
    nodeEl.classList.remove("is-related");
    nodeEl.classList.remove("is-sibling");
    const originalLabel = nodeEl.querySelector<HTMLElement>(".ego-node-label");
    if (originalLabel) {
      originalLabel.style.visibility = "hidden";
    }
    const sourceRect = nodeEl.getBoundingClientRect();
    const frame = this.createClipFrame(nodeEl);
    const clone = nodeEl.cloneNode(true) as HTMLElement;
    clone.classList.add("ego-node-fly");
    clone.classList.remove("is-active", "is-related", "is-sibling");
    clone.querySelector(".ego-node-label")?.remove();
    clone.style.position = "absolute";
    clone.style.left = `${sourceRect.left - frame.rect.left}px`;
    clone.style.top = `${sourceRect.top - frame.rect.top}px`;
    clone.style.width = `${sourceRect.width}px`;
    clone.style.height = `${sourceRect.height}px`;
    clone.style.transformOrigin = "center center";
    clone.style.pointerEvents = "none";
    frame.container.appendChild(clone);
    nodeEl.classList.add("is-animating");
    nodeEl.style.opacity = "0";

    const dx = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
    const dy = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);
    const scale = targetRect.width / sourceRect.width;

    void clone.getBoundingClientRect();
    clone.style.transition = "transform 450ms ease, opacity 450ms ease";
    clone.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;

    await new Promise<void>((resolve) => {
      const done = () => {
        clone.remove();
        frame.container.remove();
        nodeEl.classList.remove("is-animating");
        nodeEl.style.opacity = "";
        if (originalLabel) {
          originalLabel.style.visibility = "";
        }
        resolve();
      };
      const timeout = window.setTimeout(done, 600);
      clone.addEventListener(
        "transitionend",
        () => {
          window.clearTimeout(timeout);
          done();
        },
        { once: true },
      );
    });
  }

  private computeTargetPositions(targetSlug: string): Map<string, DOMRect> | null {
    const graph = this.store.getEgoGraph(targetSlug);
    if (!graph) return null;

    const ghostRoot = document.createElement("div");
    const rootRect = this.root.getBoundingClientRect();
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    const baseColumns = isMobile ? 2 : 3;
    ghostRoot.className = "ego-graph-sky ego-graph-ghost";
    ghostRoot.style.position = "fixed";
    ghostRoot.style.left = "-99999px";
    ghostRoot.style.top = "-99999px";
    ghostRoot.style.width = `${rootRect.width}px`;
    ghostRoot.style.height = `${rootRect.height}px`;
    ghostRoot.style.pointerEvents = "none";
    ghostRoot.style.visibility = "hidden";

    const grid = document.createElement("div");
    grid.className = "ego-graph-grid";
    ghostRoot.appendChild(grid);

    const sectionContents = new Map<RelationSection, HTMLElement>();
    RELATION_SECTIONS.forEach((section) => {
      const quad = document.createElement("div");
      quad.className = "ego-quadrant";
      const content = document.createElement("div");
      content.className = "ego-quadrant-content";
      quad.appendChild(content);
      grid.appendChild(quad);
      sectionContents.set(section, content);
    });

    const central = this.createGhostNode(graph.central.slug, graph.central.name, "central");
    ghostRoot.appendChild(central);

    RELATION_SECTIONS.forEach((section) => {
      const container = sectionContents.get(section);
      if (!container) return;
      let columns = baseColumns;
      let index = 0;
      let nodes = sortSection(graph[section] as RelatedNode[]);
      const isCompactParents = section === "parents" && nodes.length > 0 && nodes.length <= 2;
      if (isCompactParents) {
        columns = isMobile ? 1 : Math.min(2, nodes.length);
        container.classList.add("is-compact-parents");
      }
      nodes.forEach((item) => {
        const node = this.createGhostNode(item.entity.slug, item.entity.name, SECTION_ROLE[section]);
        const row = Math.floor(index / columns) + 1;
        const col = (index % columns) + 1;
        node.style.gridRowStart = String(row);
        node.style.gridColumnStart = String(col);
        index += 1;
        container.appendChild(node);
      });
    });

    document.body.appendChild(ghostRoot);
    const ghostRect = ghostRoot.getBoundingClientRect();
    const positions = new Map<string, DOMRect>();
    ghostRoot.querySelectorAll<HTMLElement>(".ego-node").forEach((el) => {
      const slug = el.dataset.slug;
      if (!slug) return;
      const rect = el.getBoundingClientRect();
      positions.set(
        slug,
        new DOMRect(
          rootRect.left + (rect.left - ghostRect.left),
          rootRect.top + (rect.top - ghostRect.top),
          rect.width,
          rect.height,
        ),
      );
    });

    ghostRoot.remove();
    return positions;
  }

  private createGhostNode(slug: string, name: string, role: NodeRole): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "ego-node";
    wrapper.dataset.role = role;
    wrapper.dataset.slug = slug;
    wrapper.title = name;
    return wrapper;
  }

  private createClipFrame(nodeEl: HTMLElement): { container: HTMLElement; rect: DOMRect } {
    const container = document.createElement("div");
    const grid = this.root.querySelector(".ego-graph-grid");
    const rect = grid?.getBoundingClientRect() ?? this.root.getBoundingClientRect();
    container.style.position = "fixed";
    container.style.left = `${rect.left}px`;
    container.style.top = `${rect.top}px`;
    container.style.width = `${rect.width}px`;
    container.style.height = `${rect.height}px`;
    container.style.overflow = "hidden";
    container.style.pointerEvents = "none";
    container.style.zIndex = "9997";
    document.body.appendChild(container);
    return { container, rect };
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

function prioritizeChildren(
  nodes: RelatedNode[],
  consortSlug: string,
  store: GenealogieStore,
): {
  prioritized: RelatedNode[];
  rest: RelatedNode[];
} {
  const prioritized: RelatedNode[] = [];
  const rest: RelatedNode[] = [];

  nodes.forEach((child) => {
    if (store.hasParent(child.entity.slug, consortSlug)) {
      prioritized.push(child);
    } else {
      rest.push(child);
    }
  });

  return { prioritized, rest };
}

function prioritizeConsorts(
  nodes: RelatedNode[],
  childSlug: string,
  store: GenealogieStore,
): {
  prioritized: RelatedNode[];
  rest: RelatedNode[];
} {
  const prioritized: RelatedNode[] = [];
  const rest: RelatedNode[] = [];

  nodes.forEach((consort) => {
    if (store.hasParent(childSlug, consort.entity.slug)) {
      prioritized.push(consort);
    } else {
      rest.push(consort);
    }
  });

  return { prioritized, rest };
}

function reorderSiblings(
  nodes: RelatedNode[],
  focusedChildSlug: string,
  consorts: RelatedNode[],
  store: GenealogieStore,
): RelatedNode[] {
  const focusIndex = nodes.findIndex((n) => n.entity.slug === focusedChildSlug);
  if (focusIndex === -1) return nodes;
  const parentConsorts = consorts
    .filter((consort) => store.hasParent(focusedChildSlug, consort.entity.slug))
    .map((c) => c.entity.slug);

  if (!parentConsorts.length) return nodes;
  const siblings = nodes.filter(
    (child) => child.entity.slug !== focusedChildSlug && parentConsorts.some((slug) => store.hasParent(child.entity.slug, slug)),
  );
  const others = nodes.filter(
    (child) => child.entity.slug === focusedChildSlug || !parentConsorts.some((slug) => store.hasParent(child.entity.slug, slug)),
  );

  const ordered: (RelatedNode | null)[] = Array(nodes.length).fill(null);
  ordered[focusIndex] = nodes[focusIndex];

  let siblingIdx = 0;
  for (let offset = 1; siblingIdx < siblings.length && (focusIndex - offset >= 0 || focusIndex + offset < nodes.length); offset++) {
    const leftIndex = focusIndex - offset;
    const rightIndex = focusIndex + offset;

    if (leftIndex >= 0 && siblingIdx < siblings.length && ordered[leftIndex] === null) {
      ordered[leftIndex] = siblings[siblingIdx++];
    }
    if (rightIndex < nodes.length && siblingIdx < siblings.length && ordered[rightIndex] === null) {
      ordered[rightIndex] = siblings[siblingIdx++];
    }
  }

  // Fill remaining slots with others in their original order (excluding focus already placed)
  const remaining = others.filter((child) => child.entity.slug !== focusedChildSlug);
  let remainingIdx = 0;
  for (let i = 0; i < ordered.length; i++) {
    if (ordered[i] === null && remainingIdx < remaining.length) {
      ordered[i] = remaining[remainingIdx++];
    }
  }

  // Cast away nulls (should be full) and return
  return ordered.filter((item): item is RelatedNode => item !== null);
}

function sortByOrder(nodes: RelatedNode[], order: string[]): RelatedNode[] {
  const rank = new Map<string, number>();
  order.forEach((slug, idx) => rank.set(slug, idx));
  return nodes
    .slice()
    .sort((a, b) => (rank.get(a.entity.slug) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.entity.slug) ?? Number.MAX_SAFE_INTEGER));
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
