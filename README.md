# Memo Price · Dofus Retro

Petit outil local pour mémoriser les prix HDV de Dofus Retro entre les sessions.
Excel-like dark mode, dossiers de farm, OCR sur capture HDV via NVIDIA NIM,
calcul de coût de craft.

> [!NOTE]
> Pas de backend partagé, pas de compte. Tes prix vivent dans ton browser
> (`localStorage`) et n'en bougent pas. La clé NIM, si tu en utilises une,
> reste en local dans `config.json`.

## Démarrer en 30 secondes

```bash
git clone https://github.com/BurN-30/memo-price-dofus-retro.git
cd memo-price-dofus-retro
python serve.py
```

Au premier lancement, `serve.py` télécharge les icônes (~5 MB, 30 s, une seule
fois) puis ouvre `http://127.0.0.1:8765/` dans ton browser.

Sur Windows, double-clic `lancer.bat` fait pareil.

**Prérequis :** Python 3.8+ (rien d'autre, juste la stdlib).

## Fonctionnalités

- **Catalogue intégré** — 1492 ressources, 2203 items craftables, 1451 monstres.
- **Dossiers de farm** — un par session de farm (Craq, Blop, AS, AA, Forgeron
  livrés par défaut), icônes mob ou ressource au choix.
- **txt** (bulk) — colle une liste type `pollen blop 200/u`, ça matche les
  abréviations courantes (`eco. abra s.`, `bourg`, `craq`, `kriptonite`, …)
  contre le catalogue.
- **OCR HDV** — drop une capture de fiche HDV, NIM extrait nom + niveau + prix
  x1/x10/x100 + prix moyen, on suggère le match d'item dans le catalogue. Multi
  captures à la suite, modal réduisible avec compteur en attendant.
- **Craft** — cherche un item à crafter, on calcule le coût total avec les prix
  connus et on highlight les ingrédients manquants ; bouton pour lancer un OCR
  ciblé sur l'ingrédient manquant.
- **Astuce x10** — si vendre en lot de 10 rapporte ≥ 15 % de plus par unité,
  petit conseil discret (masquable par item).

## Configurer l'OCR (optionnel)

L'OCR passe par [NVIDIA NIM](https://build.nvidia.com), qui héberge gratuitement
des modèles vision. Sans clé, l'app marche pareil — c'est juste le bouton **OCR**
qui est désactivé.

### Récupérer une clé NIM (gratuit, ~2 min)

1. Va sur [build.nvidia.com](https://build.nvidia.com), connecte-toi avec
   n'importe quel mail (compte NVIDIA gratuit).
2. Une fois connecté, ouvre n'importe quel modèle de la collection vision —
   par exemple [`meta/llama-3.2-11b-vision-instruct`](https://build.nvidia.com/meta/llama-3.2-11b-vision-instruct).
3. En haut à droite : **Get API Key** → la clé s'affiche, format `nvapi-…`.
   Copie-la (elle ne se ré-affiche pas, mais tu peux en regénérer une).
4. Le quota gratuit te donne ~1000 requêtes/mois — largement assez pour
   mémoriser des prix.

### Brancher la clé dans l'app

1. Lance l'app (`python serve.py` ou double-clic `lancer.bat`).
2. Sidebar → **réglages** → colle ta clé `nvapi-…` → choisis le modèle :
   - `Llama 3.2 11B` — rapide (~1 s), suffisant pour la plupart des HDV ;
   - `Llama 3.2 90B` — plus précis, sert aussi de fallback auto si le 11B échoue.
3. Bouton **OCR** dans la barre d'outils → drop une capture.

La clé est sauvée dans `config.json` côté serveur (Python lit ce fichier au
démarrage). Elle n'est **jamais** renvoyée au browser — celui-ci ne sait
qu'une chose : *est-ce qu'une clé est configurée*. Le fichier `config.json`
est explicitement exclu du repo via `.gitignore` ; impossible de la committer
par erreur.

## Mettre à jour proprement

```bash
git pull
```

Tes prix locaux (`localStorage`) et ta clé NIM (`config.json`) ne sont pas
touchés — ils ne sont pas dans le repo.

### Si tu veux vérifier ce que tu pulles avant de l'exécuter

C'est une bonne habitude pour tout outil qu'on lance localement :

```bash
git fetch origin
git log --oneline HEAD..origin/main      # voir les commits à venir
git diff HEAD origin/main                # voir ce qui change
git pull                                 # une fois rassuré
```

L'app fait 4 fichiers principaux (`serve.py`, `index.html`, `styles.css`,
`app.js`), au total ~3 000 lignes, c'est lisible. Les modifs sont décrites
dans [`CHANGELOG.md`](./CHANGELOG.md).

### Pour les versions stables

Si tu préfères ne pas suivre la branche `main` qui peut bouger, checkout un
tag de release :

```bash
git fetch --tags
git checkout v0.1.0   # ou la dernière version sur https://github.com/BurN-30/memo-price-dofus-retro/releases
```

## Stack technique

- **Frontend** — HTML/CSS/JS vanilla, pas de framework, pas de build step.
- **Backend** — `serve.py`, ~250 lignes de stdlib Python (pas de pip install).
  Sert les fichiers statiques et fait proxy vers NIM pour l'OCR (CORS).
- **Données** — `resources.js`, `items.js`, `mobs.js` (catalogues figés).
  Icônes téléchargées au premier lancement depuis dofusretrotools.com.
- **Persistence** — `localStorage` pour tes prix/dossiers, `config.json`
  pour la clé NIM côté serveur.

## Structure

```
memo-price-dofus-retro/
├── serve.py                  # mini HTTP server + proxy NIM
├── lancer.bat                # raccourci Windows
├── index.html                # UI
├── styles.css                # thème sombre marron
├── app.js                    # toute la logique browser
├── resources.js / .json      # 1492 ressources Dofus Retro
├── items.js / .json          # 2203 items craftables
├── mobs.js / .json           # 1451 monstres
├── version.json              # version courante
├── download_*.py             # scripts pour re-fetch les icônes
├── icons/        ← téléchargé au premier lancement
├── item-icons/   ← idem
└── mob-icons/    ← idem
```

## Crédits

- Données et icônes via [Dofus Retro Tools](https://dofusretrotools.com).
  Tout le crédit du travail d'agrégation leur revient.
- Items, monstres et univers Dofus appartiennent à [Ankama](https://www.ankama.com/).
- Projet non-officiel, non affilié.

## Licence

MIT — voir [`LICENSE`](./LICENSE).
