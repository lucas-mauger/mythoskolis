# Mythoskolis — Spécification V2 “Ego-Graph animé”
*(Transitions fluides entre personnages proches)*

## 🎯 Objectif

Mettre en place une **navigation fluide** dans l’arbre généalogique :  
quand on clique sur un parent / enfant / frère-sœur / consort, le personnage sélectionné **glisse vers le centre**, son propre entourage apparaît autour, et l'ancien centre se repositionne dans son rôle naturel.

Effet visuel attendu :  
- recentrage doux,  
- constellation qui se réorganise autour du nouveau personnage,  
- expérience sans rupture, très smooth, mais **sans passer en SPA lourde**.

---

## 📌 Approche générale

Nous restons dans un site Astro **majoritairement statique**.  
L’ego-graph animé se fera dans un **composant client isolé**, monté uniquement sur la page `/genealogie/[id]`.

La data reste statique et générée au build.

---

## 📁 Structure des données

Les données généalogiques viennent de :

```
data/genealogie.yml
```

Elles doivent être converties au build en un fichier JSON global :

```
/public/data/genealogie.json
```

Ce JSON contient :
- `entities[]`: `{ id, name, slug, culture }`
- `relations[]`: `{ source_id, target_id, type, source_texts[], variant? }`

Tout doit être chargé **une seule fois** côté client (fetch statique).

---

## 🔧 Architecture du composant

Créer un composant client (React ou Svelte ou Vanilla avec un petit store), par exemple :

```
src/components/EgoGraphInteractive.jsx
```

Il sera importé uniquement sur `/genealogie/[id].astro`.

### État minimal requis

```js
{
  currentId: "zeus",
  data: genealogieJSON,
  egoGraph: { parents, children, siblings, consorts },
  layout: { positionsById },
}
```

### Rôle du composant

1. Charger le JSON global au montage.  
2. Calculer l’ego-graph à partir de `currentId`.  
3. Déterminer les positions cibles (x, y) pour chaque entité.  
4. Animer la transition entre l’ancien layout et le nouveau.  
5. Gérer le clic sur une entité :  
   - mettre à jour `currentId`,  
   - recalculer egoGraph,  
   - recalculer layout,  
   - lancer l’animation.

---

## 🎨 Layout des “anneaux” (constellation)

Principe simple et robuste :

- **Centre** : (0, 0)
- **Anneaux** (distances approximatives) :
  - Parents : `y = -160`
  - Enfants : `y = +160`
  - Fratrie : `x = -160`
  - Consorts : `x = +160`

Chaque anneau a `N` slots répartis autour d'un arc ou d’un cercle.

Exemple :
```
parents[0] → (-40, -160)
parents[1] → (+40, -160)
```

---

## ✨ Animation — requirements précis

Toutes les bulles (dieux) doivent être des éléments **positionnés en absolute** dans un container.

Chaque bulle doit avoir :

```css
transition: transform 250ms ease-out, opacity 200ms ease-out;
```

Lors d’un changement de centre :

- On met à jour `transform: translate(x, y)` vers sa nouvelle position.  
- Les bulles qui disparaissent passent à `opacity: 0` puis sont retirées du DOM après 200ms.  
- Les nouvelles bulles apparaissent avec `opacity: 0 → 1` + un léger décalage (`translateY(6px)` optionnel).

Objectif visuel :

- le centre glisse vers son anneau,  
- le nouveau centre glisse vers le milieu,  
- les satellites se repositionnent en douceur,  
- aucun “snap” brutal.

---

## ↔️ Navigation

**Pas de reload complet**.  
La navigation se fait entièrement dans le composant :

1. Clic sur `id_next`.  
2. `currentId = id_next`.  
3. Recalcul de l’egoGraph.  
4. Recalcul du layout.  
5. Transition animée automatique.

Pour la V2 :  
- **Pas de changement d’URL** (éventuellement `history.pushState()` plus tard).

---

## 🧱 Prérequis techniques dans le repo

Avant d’implémenter :

- `genealogie.yml` doit être propre.  
- Le parsing YAML → JSON doit exister.  
- La page `/genealogie/[id]` doit déjà exister en version statique V1 (sans animation).

Si un fichier manque, le créer proprement, sans dépendances lourdes.

---

## 🎁 Bonus optionnel (pas obligatoire V2)

- petit **zoom** du centre lors du recentrage : `scale(1 → 1.05 → 1)`  
- très léger **spin** (< 3°) pour effet “cosmique”

---

## ✔️ Résultat final attendu

Quand l’utilisateur clique sur un parent / enfant / consort / frère-sœur :

- l’entité cliquée se **déplace au centre**,  
- l’ancien centre glisse dans son anneau naturel,  
- la constellation entière se recompose,  
- les nouveaux nœuds apparaissent en fade-in,  
- animation en ~250 ms,  
- zéro reload,  
- zéro backend,  
- JSON statique chargé une seule fois.

**Une vraie navigation cosmique fluide entre dieux.**

---

## 📊 État actuel (2025-03)

- Génération automatique de `public/data/genealogie.json` (script `scripts/generate-genealogie-json.mjs` déclenché en `predev`/`prebuild`).
- Nouveau composant `EgoGraphInteractive.astro` :
  - colonnes visuelles Parents / Fratrie / Consorts / Enfants couvrant toute la hauteur, portraits tirés de `public/faces/`,
  - navigation client-side via drag/scroll infini (fenêtre fixe 80–90 vh, centrage automatique du personnage focus),
  - bandeau sticky “Parents / Fratrie / Consorts / Enfants” pour garder le repère pendant le scroll.
- Données YAML étendues (famille complète des Olympiens dont Hestia) + JSON régénéré.

## 🔭 À peaufiner pour la suite

1. **Alignement mobile** : vérifier les colonnes à < 400 px et ajuster `COLUMN_FRACTIONS` si ça déborde encore (ex. parents/fratrie légèrement plus proches du centre).  
2. **Traits SVG** : passer définitivement derrière les portraits (z-index OK) mais envisager un fondu/adoucissement pour éviter la toile d’araignée quand il y a beaucoup de liens.  
3. **Colonnes** : aujourd’hui les libellés sont dans les fonds; à terme on peut remplacer par une vraie légende ou un bandeau sticky, et éventuellement afficher un badge discret dans les bulles côté desktop seulement.  
4. **Accessibilité** : prévoir un fallback textuel (liste) ou une vue simple quand JavaScript est désactivé.

Garde ces points en tête avant la prochaine session pour éviter de repartir de zéro.

---

Fin de spécification.
