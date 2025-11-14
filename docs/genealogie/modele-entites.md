# 🔗 Modèle des entités (généalogie)

La généalogie sera modélisée via un fichier YAML, avec les entités suivantes :

- **id** : identifiant stable (ex: `zeus`)
- **nom** : nom humain lisible
- **parents** : liste des parents directs
- **enfants** : liste des enfants directs
- **epoux/epouses** (optionnel)
- **commentaires** : notes de variantes mythologiques

---

## Exemple minimal

```yaml
id: zeus
nom: Zeus
parents: [cronos, rhea]
enfants: [ares, hephaistos, athena]
epoux:
  - hera
commentaires: >
  Selon certaines traditions, Athéna naît seulement de Zeus.

---

## 📄 `docs/genealogie/exemple-relations.yaml`

```yaml
# Exemple très simple pour valider la structure de données généalogique

- id: cronos
  nom: Cronos
  parents: [ouranos, gaia],
  enfants: [zeus, poseidon, hades]

- id: rhea
  nom: Rhéa
  parents: [ouranos, gaia]
  enfants: [zeus, poseidon, hades]

- id: zeus
  nom: Zeus
  parents: [cronos, rhea]
  enfants: [ares, athena]
  epoux:
    - hera
