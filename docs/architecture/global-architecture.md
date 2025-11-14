# 🏗️ Architecture du projet — Mythoskolis

## Composants principaux

- **Astro** : framework statique/light mode server-side
- **TailwindCSS** : styles utilitaires
- **Netlify** : déploiement continu (prod sur `main`, previews via PR)
- **Decap CMS** (à venir) : édition du contenu via interface
- **YAML** (à venir) : modélisation généalogique
- **Markdown** : contenu éditorial (fiches dieux, ressources)

## Flux

1. Le contenu est versionné dans `src/content/`
2. Le CMS (Decap) éditera ces contenus
3. Astro génère les pages statiques
4. Netlify déploie automatiquement selon la branche
5. Le graphe généalogique utilisera les fichiers YAML

---

## Schéma global (simple)

[Decap CMS] → [Content Markdown/YAML] → [Astro Build] → [Netlify Deploy]
