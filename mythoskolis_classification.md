# Classification des entités mythologiques

Ce document fournit une taxonomie claire des différentes natures d'êtres dans la mythologie grecque. Il sert de référence pour l'implémentation dans le front matter YAML des fiches Mythoskolis et pour les modèles de données du graphe généalogique.

---

# 1. Objectif

Créer une classification standardisée, cohérente et exploitable dans le CMS Decap et dans `data/genealogie.yml`. Elle doit permettre :

- une identification claire de la **nature** d'une entité ;
- une structuration propre dans le YAML ;
- une exploitation future pour les filtres, badges, affichages ou navigation.

---

# 2. Classification principale

## 2.1 Divinités primordiales
**Définition :** premières entités cosmiques issues du Chaos. Pas anthropomorphiques.

**Exemples :** Chaos, Gaïa, Ouranos, Nyx, Érèbe, Tartare, Pontos.

**YAML :**
```yaml
display_class: "Divinité primordiale"
nature: primordiale
```

---

## 2.2 Titans / Titanides
**Définition :** génération divine issue de Gaïa et Ouranos, forces fondamentales avant les Olympiens.

**Exemples :** Cronos, Rhéa, Océan, Téthys, Thémis, Japet.

**YAML :**
```yaml
display_class: "Titan / Titanide"
nature: titan
```

---

## 2.3 Dieux olympiens
**Définition :** dieux gouvernant le monde après la Titanomachie ; anthropomorphiques.

**Exemples :** Zeus, Héra, Athéna, Apollon, Arès.

**YAML :**
```yaml
display_class: "Dieu olympien"
nature: olympien
```

---

# 3. Divinités et esprits intermédiaires

## 3.1 Nymphes
**Définition :** esprits féminins de la nature (eaux, montagnes, arbres...). Souvent locales.

**Sous-types :**
- Dryades / Hamadryades (arbres)
- Naïades (eaux douces)
- Oreades (montagnes)
- Néréides (mer)
- Lampades (suivantes d'Hécate)

**Exemple :** Daphné, Écho, Thétis.

**YAML :**
```yaml
display_class: "Nymphe"
nature:
  category: nymphe
  subtype: naiade  # ou dryade / nereide / oreade …
```

---

## 3.2 Océanides
**Définition :** nymphes filles d’Océan et Téthys, associées aux eaux, nuages et flux naturels.

**Exemples :** Métis, Styx, Eurynomé.

**YAML :**
```yaml
display_class: "Océanide"
nature:
  category: divinite_maritime
  subtype: oceanide
```

---

## 3.3 Néréides
**Définition :** nymphes marines filles de Nérée et Doris.

**Exemples :** Thétis, Amphitrite.

**YAML :**
```yaml
display_class: "Néréide"
nature:
  category: divinite_maritime
  subtype: nereide
```

---

## 3.4 Pléiades
**Définition :** nymphes astrales, filles d’Atlas et Pléioné, liées à la constellation éponyme.

**Exemples :** Maïa, Électre, Taygète.

**YAML :**
```yaml
display_class: "Pléiade"
nature:
  category: nymphe
  subtype: pleiade
```

---

# 4. Héros et demi-dieux
**Définition :** figures humaines exceptionnelles, souvent nées d'un dieu et d'un mortel.

**Exemples :** Héraclès, Persée, Achille.

**YAML :**
```yaml
display_class: "Héros / Demi-dieu"
nature: heros
```

---

# 5. Créatures et monstres
**Définition :** êtres hybrides ou terrifiants, liés à des forces anciennes.

**Exemples :** Typhon, Échidna, Gorgones, Harpyes.

**YAML :**
```yaml
display_class: "Créature mythologique"
nature: creature
```

---

# 6. Recommandations pour l'intégration YAML

## 6.1 Champs recommandés dans chaque fiche
```yaml
title: "Athéna"
slug: "athena"
image: "athena.webp"
display_class: "Dieu olympien"
nature: olympien
```

## 6.2 Champs si entité composite (nymphe, sous-type...)
```yaml
display_class: "Nymphe"
nature:
  category: nymphe
  subtype: naiade
```

## 6.3 Champs compatibles avec `genealogie.yml`
```yaml
entities:
  - id: athena
    name: Athéna
    slug: athena
    nature: olympien
  - id: maia
    name: Maïa
    slug: maia
    nature:
      category: nymphe
      subtype: pleiade
```

---

# 7. Résumé opérationnel

- **Une seule source de vérité** pour les types : ce fichier + YAML principal.
- **Deux niveaux** disponibles : `nature` (simple) ou `nature.category/subtype` (complexe).
- **display_class** sert uniquement à l’UI (badges, affichage propre).
- Les valeurs sont pensées pour fonctionner **à la fois dans Decap CMS et dans l’ego-graph**.

---

# 8. Table de correspondance rapide

| Classe | Nature YAML | Notes |
|--------|--------------|--------|
| Divinité primordiale | `primordiale` | Forces cosmiques |
| Titan / Titanide | `titan` | Génération antérieure |
| Olympien | `olympien` | Dieux majeurs |
| Nymphe | `nymphe` | Peut contenir un `subtype` |
| Océanide | `divinite_maritime / oceanide` | Spécifique à Océan + Téthys |
| Néréide | `divinite_maritime / nereide` | Filles de Nérée |
| Pléiade | `nymphe / pleiade` | Nymphes astrales |
| Héros | `heros` | Demi-dieux possibles |
| Créature | `creature` | Monstres, hybrides |

---

Fin du document.

