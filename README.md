# Memo Price · Dofus Retro

Petit outil local pour mémoriser les prix HDV de Dofus Retro entre les sessions.
Excel-like dark mode, dossiers de farm, OCR sur capture HDV via NVIDIA NIM,
calcul de coût de craft.

> [!IMPORTANT]
> **100 % local, pas de partage.** L'app tourne sur ta machine, point. Il n'y a
> ni backend mutualisé ni base de prix communautaire : tu ne vois que les
> prix que **toi tu rentres** (au clavier, via OCR, ou collés en bulk). Idem
> pour tes potes : chacun a sa propre base. Si tu veux échanger des prix avec
> eux, passe par `export` / `import` JSON dans la sidebar.
>
> Tes données (prix, dossiers, préférences) vivent uniquement dans le
> `localStorage` de ton browser. Ta clé NIM, si tu en mets une, reste dans
> `config.json` côté serveur — jamais envoyée nulle part sauf à NIM lui-même
> au moment d'un OCR.

## Prérequis

- **[Python 3.8+](https://www.python.org/downloads/)** — c'est tout côté
  serveur. Pas de `pip install`, on utilise uniquement la stdlib.
- **Un browser moderne** (Chrome, Firefox, Edge, Brave, …).
- **Optionnel — clé NVIDIA NIM** si tu veux activer l'OCR sur captures HDV.
  Création gratuite en 2 min, voir [Configurer l'OCR](#configurer-locr-optionnel).

> [!NOTE]
> Pas besoin de Node.js, npm, Docker, base de données ou autre. C'est du
> HTML/CSS/JS vanilla servi par un serveur Python de ~250 lignes.

## Démarrer en 30 secondes

```bash
git clone https://github.com/BurN-30/memo-price-dofus-retro.git
cd memo-price-dofus-retro
```

Puis :

| OS | Lancer | Arrêter |
|---|---|---|
| **Windows** | double-clic `lancer.bat` | double-clic `stop.bat` (ou ferme la fenêtre noire) |
| **macOS / Linux** | `./lancer.sh` | `./stop.sh` (ou Ctrl+C dans le terminal) |
| **N'importe** | `python serve.py` | Ctrl+C dans le terminal |

Au premier lancement, `serve.py` télécharge les icônes (~5 MB, 30 s, une
seule fois) puis ouvre `http://127.0.0.1:8765/` dans ton browser.

**Prérequis :** [Python 3.8+](https://www.python.org/downloads/) (rien
d'autre, juste la stdlib — pas de `pip install`).

### Important : arrêter le serveur

Le serveur Python tourne en tâche de fond. **Fermer l'onglet du browser
n'arrête pas le serveur**, il continue à occuper le port 8765.

- **Plus simple** : ferme la fenêtre console (cmd/terminal) qui s'est
  ouverte au lancement.
- **Si tu l'as perdue** : Windows → `stop.bat`. macOS/Linux → `./stop.sh`.
- **Manuel ultime** :
  - Windows : `netstat -ano | findstr :8765` puis `taskkill /F /PID <id>`
  - macOS/Linux : `kill $(lsof -ti :8765)`

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

## Remerciements

Ce projet n'existerait littéralement pas sans le travail de **[YAKUZA](https://x.com/Le__YAKUZA)**
et de l'équipe derrière **[Dofus Retro Tools](https://dofusretrotools.com)**.

Toutes les données utilisées par Memo Price viennent de leur API publique :

- les **1492 ressources** avec leur niveau, type, pods, descriptions,
- les **2203 items craftables** avec leurs recettes complètes,
- les **1451 monstres** du bestiaire,
- les **icônes SVG** de tout ce beau monde.

Sans cette base de données soigneusement maintenue et exposée publiquement,
il aurait fallu des semaines pour scraper et nettoyer tout ça à la main. Donc
gros merci à eux — si vous jouez à Dofus Retro, allez voir leur site, ils
font un boulot dingue (carte interactive, simulateur de drop, encyclopédie,
profils membres, etc.). Bien plus complet que cette petite app.

- Site : [dofusretrotools.com](https://dofusretrotools.com)
- Twitter / X : [@Le__YAKUZA](https://x.com/Le__YAKUZA)
- Twitch : [twitch.tv/proyakuza](https://www.twitch.tv/proyakuza)

Le code créateur Dofus officiel de YAKUZA est `YAKUZA` — pensez à le
spammer en jeu si vous voulez le soutenir gratuitement.

### Aussi merci à

- **[Ankama](https://www.ankama.com/)** pour Dofus, l'univers, et les sprites
  des items / monstres / ressources qui transitent ici.
- **[NVIDIA](https://build.nvidia.com)** qui héberge gratuitement les modèles
  vision utilisés pour l'OCR des fiches HDV.

Projet non-officiel, non affilié à Ankama ni à Dofus Retro Tools.
Si YAKUZA ou Ankama souhaitent que ce projet soit retiré, ouvrez une issue
ou contactez-moi, je m'exécuterai sans soucis.

## Licence

MIT — voir [`LICENSE`](./LICENSE).
Les données et icônes Dofus restent propriété de leurs ayants droit.
