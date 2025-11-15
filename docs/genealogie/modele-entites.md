# 🔗 Modèle des entités (généalogie)

Les données généalogiques sont désormais stockées dans `data/genealogie.yaml`.  
On sépare les **entités** (les personnages) et les **relations** avec des sources précises, pour refléter les variantes mythologiques.

---

## 1. Section `entities`

Chaque entrée décrit un personnage, identifié par un `id` stable :

```yaml
entities:
  - id: zeus            # kebab-case
    name: Zeus          # libellé humain
    slug: zeus          # pour les URLs / pages Astro
    culture: grecque    # permet d’ajouter d’autres panthéons
```

On pourra enrichir plus tard (époque, type, notes…), mais ces quatre champs restent obligatoires.

---

## 2. Section `relations`

Chaque relation est directionnelle (`source_id` → `target_id`) avec un `type` parmi `parent`, `child`, `sibling`, `consort`.  
On attache toujours les sources qui justifient la relation, avec éventuellement un `variant` pour les traditions divergentes.

```yaml
relations:
  - source_id: zeus
    target_id: athena
    type: parent
    source_texts:
      - author: Hésiode
        work: Théogonie
        note: "v.886-900"
  - source_id: hera
    target_id: hephaistos
    type: parent
    variant: "Naissance sans Zeus"
    source_texts:
      - author: Hésiode
        work: Théogonie
        note: "v.924-926"
```

Pour les relations réciproques (ex: Zeus ↔ Héra en tant qu’époux), on crée deux lignes si besoin (`consort` dans chaque sens) afin de simplifier les requêtes.

---

## 3. Données initiales

`data/genealogie.yaml` embarque déjà un sous-ensemble “famille de Zeus” :

- Entités couvertes : Cronos, Rhéa, Zeus, Héra, Métis, Athéna, Léto, Apollon, Artémis, Arès, Héphaïstos.
- Relations fournies :
  - Parents de Zeus (Cronos / Rhéa),
  - Couple Zeus ↔ Héra, Zeus ↔ Métis, Zeus ↔ Léto,
  - Descendance (Athéna, Apollon, Artémis, Arès, Héphaïstos) avec variantes sourcées.

Ces données servent de base pour brancher l’utilitaire Astro (M3) et tester rapidement l’ego-graph.

---

## 4. Utilitaire & page de test

- `src/lib/genealogie.ts` charge le YAML au build et expose :
  - `getAllEntities()` pour générer les routes,
  - `getEgoGraph(slug)` pour la structure brute,
  - `getGraphDisplayData(slug)` qui prépare des sections prêtes à afficher (parents/fratrie/consorts/enfants).
- `src/components/EgoGraph.astro` dessine les quatre blocs en Tailwind.
- `src/pages/genealogie/[slug].astro` génère une page pour chaque dieu (même sans données YAML) :
  - si la personne est présente dans `data/genealogie.yaml`, on affiche l’ego-graph + le JSON de debug,
  - sinon, une carte “Cartographie en cours” explique que les relations sont en train d’être sourcées.

👉 Ouvre `http://localhost:4321/genealogie/zeus` en dev pour vérifier rapidement que les données répondent comme prévu.
