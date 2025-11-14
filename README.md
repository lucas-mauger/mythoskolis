# 🏛️ Mythoskolis — Site de médiation autour des mythologies

Mythoskolis est un site web moderne dédié à la découverte des mythologies à travers des fiches synthétiques, des illustrations originales et (à terme) un système dynamique de filiations entre divinités.

Le projet a pour objectifs :
- de proposer un accès **simple, clair et gratuit** à des contenus culturels de qualité ;
- de rendre les mythes **visuels, vivants et accessibles** ;
- d’offrir aux enseignants, élèves et curieux un outil propre et sans distraction ;
- d’expérimenter une **modélisation de données** (généalogies, relations, sources) intégrée à une interface Web moderne.

Le site est construit avec **Astro**, **TailwindCSS**, un **CMS headless (Decap)** et une structuration des contenus en **Markdown + frontmatter**.

---

## 🚀 1. Prérequis

Avant de lancer le projet, assurez-vous d’avoir :

- **Node.js ≥ 20**  
  (Recommandé : installation via NVM)

```bash
node -v
npm -v
```

- **npm** installé (fourni avec Node).

---

## 📦 2. Installation

Clonez le dépôt :

```bash
git clone <URL_DU_REPO>
cd mythoskolis
```

Installez les dépendances :

```bash
npm install
```

---

## 🧪 3. Lancement du projet (développement)

Pour démarrer le serveur local :

```bash
npm run dev
```

Le site sera accessible à l’adresse indiquée dans le terminal (généralement `http://localhost:4321`).

---

## 🛠️ 4. Scripts disponibles

```bash
npm run dev       # Lance le serveur de développement
npm run build     # Génère le site statique dans /dist
npm run preview   # Prévisualise le build
npm run format    # Formate le code avec Prettier
npm run lint      # Analyse le code avec ESLint
```

---

## 🧱 5. Structure du projet

```
mythoskolis/
│
├── public/                 # Fichiers statiques (images, vidéos, assets)
│   └── admin/              # Interface Decap CMS
│
├── src/
│   ├── components/         # Composants Astro réutilisables
│   ├── content/            # Fiches (dieux, ressources...) en Markdown
│   ├── pages/              # Pages Astro => routes du site
│   └── styles/             # Styles globaux (Tailwind)
│
├── .astro/                 # Types générés automatiquement par Astro
├── astro.config.mjs        # Configuration Astro
├── tailwind.config.mjs     # Configuration Tailwind CSS
├── package.json            # Dépendances et scripts
└── README.md               # Ce fichier
```

---

## 🪢 6. Branching model

Le projet suit une organisation simple :

- `main` = branche stable et protégée  
  (pas de commit direct → PR obligatoire)
- `feature/*` = une branche par brique / fonctionnalité
- Merge via Pull Request uniquement

---

## 📌 7. État actuel du projet

- Mise en place de l’environnement Astro sur Zorin Linux  
- Installation Prettier + ESLint (formatage + lint)  
- Normalisation du workflow Git  
- Début de la roadmap technique (CMS, données généalogiques, SEO…)

---

## ✨ 8. Licence

Projet personnel — licence à définir selon les besoins futurs.