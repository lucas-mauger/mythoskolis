# Modélisation des nouvelles collections : récits, créatures, objets

## Objectif
Étendre Mythoskolis au-delà de la seule généalogie en intégrant trois nouvelles catégories de contenus éditoriaux : **récits**, **créatures**, **objets/artefacts**. Ces contenus doivent être cohérents avec les personnages existants et reliés à eux via leurs `id`/`slug`.

Ce document décrit la structure des données, les liens entre collections, et les principes à suivre pour l'implémentation dans Astro + Decap.

---

# 1. Principes généraux

## 1.1. Une source de vérité par type d'information
- `data/genealogie.yml` reste **réservé aux personnages et aux relations de filiation**.
- Les contenus éditoriaux (textes) sont stockés sous `content/` dans des collections séparées.

## 1.2. Identifiants uniques et stables
- Tous les personnages ont un `id`/`slug` défini dans `genealogie.yml`.
- Tous les récits, créatures et objets auront également un `id`/`slug` unique.
- Les liens se font **exclusivement par ces identifiants**.

## 1.3. Relations unidirectionnelles
- Un récit liste les personnages impliqués.
- Une page de dieu affiche les récits associés **en dérivant ces données automatiquement**, sans duplication.
- Idem pour objets et créatures.

---

# 2. Collections à créer

Dossier général : `content/`

- `content/dieux/` → existant
- `content/recits/` → **nouveau**
- `content/creatures/` → **nouveau**
- `content/objets/` → **nouveau**

Chaque entrée est un fichier `.md` avec front matter YAML.

---

# 3. Spécifications par collection

## 3.1. Récits
Dossier : `content/recits/`

Exemple de front matter :

```yaml
---
title: "La naissance d’Apollon et Artémis"
slug: "naissance-apollon-artemis"
id: "naissance-apollon-artemis"
type: "recit"

main_entities:
  - leto
  - apollon
  - artemis
  - zeus
opponents:
  - hera
places:
  - delos
artifacts:
  - caducee
  - foudre-de-zeus

era: "Cycle apollinien"
importance: "majeur"
summary: >
  Léto, pourchassée par Héra, trouve refuge sur l’île flottante de Délos...

sources:
  - author: Callimaque
    work: Hymne à Artémis
  - author: Hésiode
    work: Fragment X
---
```

Champs clés :
- `main_entities`: liste d’IDs de personnages (`zeus`, `hera`, etc.).
- `artifacts`: liste d’IDs d’objets.
- `places`: simple texte ou future collection.

## 3.2. Créatures
Dossier : `content/creatures/`

Exemple :

```yaml
---
title: "Python de Delphes"
slug: "python-delphes"
id: "python-delphes"
type: "creature"

category: "dragon"
culture: "greek"

# Optionnel : si la créature apparaît dans genealogie.yml
entity_id: "python"

associated_deities:
  - apollon
  - gaia

associated_recits:
  - naissance-apollon-artemis
  - prise-de-delphes-par-apollon

symbols:
  - serpent
  - oracles
---
```

## 3.3. Objets & artefacts
Dossier : `content/objets/`

Exemple :

```yaml
---
title: "Le caducée"
slug: "caducee"
id: "caducee"
type: "artefact"

category: "baton"
culture: "greek"

associated_entities:
  - hermes
  - apollon

associated_recits:
  - naissance-apollon-artemis
  - hermes-messager-des-dieux

symbolism:
  - messagerie
  - commerce
  - passage entre les mondes
---
```

---

# 4. Communication entre collections

## 4.1. Via les IDs/Slugs
Tous les liens se font en croisant les IDs :
- Zeus → liste des récits où `main_entities` contient `zeus`.
- Apollon → objets où `associated_entities` contient `apollon`.
- Python → récits où `associated_creatures` contient `python-delphes`.

Aucune donnée n’est dupliquée.

## 4.2. Index global côté build Astro
Au moment du build, Astro peut générer un index réunissant les liens :

Pseudo-code :
```ts
const dieux = await getCollection("dieux");
const recits = await getCollection("recits");
const objets = await getCollection("objets");
const creatures = await getCollection("creatures");

function getAssociations(entityId) {
  return {
    recits: recits.filter(r => r.data.main_entities?.includes(entityId)),
    objets: objets.filter(o => o.data.associated_entities?.includes(entityId)),
    creatures: creatures.filter(c => c.data.associated_deities?.includes(entityId)),
  };
}
```

La page d’un dieu peut ensuite importer cette fonction.

---

# 5. Interaction avec Decap CMS

Les collections doivent être déclarées dans `admin/config.yml`.

Exemple pour `recits` :

```yaml
- name: "recits"
  label: "Récits"
  folder: "content/recits"
  create: true
  slug: "{{slug}}"
  fields:
    - { name: "title", label: "Titre", widget: "string" }
    - { name: "slug", label: "Slug", widget: "string" }
    - { name: "main_entities", label: "Personnages principaux", widget: "relation", collection: "dieux", searchFields: ["title"], valueField: "slug", multiple: true }
    - { name: "body", label: "Texte", widget: "markdown" }
```

Même logique pour `creatures` et `objets`.

Avantage : l’utilisateur coche des dieux dans une liste, Decap stocke automatiquement leurs slugs.

---

# 6. Gestion des créatures dans la généalogie

Deux cas :
1. **Créature avec parenté mythologique claire** → ajout dans `genealogie.yml` + fiche éditoriale.
2. **Créature isolée (monstre d’épisode)** → seulement fiche éditoriale.

Un champ optionnel `entity_id` dans les fiches permet de faire le lien vers le graphe lorsqu’il existe.

---

# 7. Résumé des décisions

- Le fichier `genealogie.yml` ne change pas de rôle : **personnages + filiation**.
- Trois nouvelles collections Markdown : `recits`, `creatures`, `objets`.
- Tous les liens reposent sur les `id`/`slug`.
- Les relations se résolvent **automatiquement au build**, jamais en dupliquant des données.
- Decap CMS doit fournir des champs `relation` pour sélectionner facilement dieux, objets, créatures.

Ce modèle permet :
- une extension propre,
- une UI claire côté CMS,
- une future automatisation simple côté Astro.

---

# Fin du document

