# 📘 Changelog — Mythoskolis

Ce fichier suit le format **Keep a Changelog** :  
https://keepachangelog.com/fr/1.1.0/

Il utilise un **versioning sémantique** simplifié (`0.x.x`) le temps que le projet progresse vers une première version stable.

---

## [Unreleased]
### Added
- Mise en place du workflow Git (branche `main` protégée + PR obligatoires)
- Installation et configuration de Prettier + ESLint
- Lecture/formatage automatique du code
- README complet : présentation du projet, installation, scripts, structure

### Changed
- Normalisation du format de code via Prettier
- Refonte du composant `EgoGraphInteractive` : layout scrollable, colonnes pleine hauteur, portraits centrés et navigation drag/pan
- Ajout d’un bandeau sticky “Parents / Fratrie / Consorts / Enfants” pour garder le repère lors du scroll
- README + instructions Codex mis à jour (structure médias, génération JSON, état de l’ego-graph)

### Fixed
- Problèmes initiaux de symlinks sous Zorin (migration vers partition ext4)
- Correction du workflow PR (désactivation de `Require approvals` pour travail solo)

---

## [0.1.0] – 2025-11-XX
### Added
- Version initiale du site (Astro + Tailwind)
- Structure des dossiers
- Pages de base (index, dieux, ressources)
- Déploiement Netlify automatique

---

### 📝 Notes
- La version `0.x` signifie que l’API, la structure ou la modélisation des données peuvent changer à tout moment.
- Le passage en `1.0` se fera quand le cœur du projet (contenu, CMS, généalogie) sera stabilisé.
