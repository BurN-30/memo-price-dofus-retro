# Pénates · Memo des prix HDV · Dofus Retro

> *Préserve la connaissance des prix.*

Outil web minimaliste pour mémoriser les prix HDV de Dofus Retro 1.29 entre les sessions de jeu : excel-like dark mode, dossiers de farm, OCR sur capture HDV via NVIDIA NIM, calcul de coût de craft, suivi de marges.

> [!IMPORTANT]
> **Hébergé centralement, données isolées par utilisateur.** Pénates tourne sur Cloudflare Workers, mais tes données (prix, dossiers, préférences, clé NIM) restent **uniquement dans le `localStorage` de ton navigateur**. Personne d'autre, ni le serveur Pénates, ni un service tiers, ne voit tes prix.
>
> Si tu actives l'OCR : ta clé NVIDIA NIM est aussi en `localStorage` browser. Le Worker fait juste passe-plat vers NIM avec ta clé en `Authorization: Bearer`, sans rien stocker. Code source du Worker : [`src/index.js`](./src/index.js), 100 % lisible.

## Pour commencer

1. Va sur le site Pénates *(URL définitive à venir)*.
2. *(Optionnel — pour activer l'OCR)* Récupère une clé NVIDIA NIM gratuite : [build.nvidia.com](https://build.nvidia.com), 2 minutes, pas de carte de crédit. Détail dans l'app (Réglages → accordéon « Comment récupérer une clé »).
3. Sur Pénates, ouvre **Réglages**, colle ta clé `nvapi-…`, clique **Tester** puis **Enregistrer**.
4. **C'est tout.** Tes prix sont sauvegardés au fur et à mesure dans ton navigateur.

## Fonctionnalités

- **Catalogue intégré** — 1492 ressources, 2203 items craftables, 1451 monstres (données issues de [Dofus Retro Tools](https://dofusretrotools.com)).
- **Dossiers de farm** personnalisables (Craq, Blop, AS, AA, Forgeron pré-remplis), icônes mob ou ressource au choix.
- **txt** (bulk) — colle une liste type `pollen blop 200/u`, matching fuzzy + aliases reconnus (`eco. abra s.`, `bourg`, `craq`, `kriptonite`, etc.).
- **OCR HDV** — drop une capture, NIM extrait nom + niveau + prix x1/x10/x100, suggère le match catalogue. Multi-captures simultanées avec widget flottant.
- **Craft** — recherche d'item, calcul du coût total, prix manquants surlignés, OCR ciblé sur ingrédient manquant.
- **Crafts suivis** — dossier spécial : coût ingrédients live, prix HDV éditable inline, marge nette colorée (vert/rouge).
- **Astuce x10** discrète si vendre en lot rapporte ≥15 % de plus par unité.

## Confidentialité

- ✅ Tes prix et dossiers : `localStorage` browser, **jamais** transmis au serveur Pénates.
- ✅ Ta clé NIM : `localStorage` browser, transmise au Worker UNIQUEMENT lors d'un OCR (pour qu'il appelle NIM en ton nom).
- ✅ Worker : **passe-plat sans stockage**. Code source ouvert, vérifiable.
- ✅ Aucun cookie de tracking, aucun analytics tiers.

## Le nom

**Pénates** fait référence à la **Confrérie des Pénates** du lore Dofus, organisation dédiée à la préservation de la connaissance, qui occupait jadis la zone des Pénates du Corbac. La métaphore colle bien avec un outil de mémoire des prix HDV : préserver le savoir des marchands d'une session à l'autre.

## Stack technique

- **Frontend** — HTML/CSS/JS vanilla, zéro framework, zéro build step.
- **Backend** — Cloudflare Workers + Static Assets (~150 lignes JS), proxy CORS pour NVIDIA NIM avec rate-limit IP basique.
- **Données catalogue** — JSON figés (`resources.json`, `items.json`, `mobs.json`), icônes SVG hébergées avec le site.
- **Persistence user** — `localStorage` browser uniquement.
- **Hébergement** — Cloudflare Workers free tier (100k req/jour, suffisant).

## Développement local *(pour bidouiller le code)*

Pré-requis : Node.js 18+ et un compte Cloudflare gratuit (pour `wrangler deploy`).

```bash
git clone https://github.com/BurN-30/memo-price-dofus-retro.git
cd memo-price-dofus-retro
npm install
npm run dev   # = wrangler dev
```

Site servi sur `http://localhost:8787/`.

Pour déployer (sur ton propre compte Cloudflare) :

```bash
wrangler login
npm run deploy
```

## Crédits

Ce projet n'existerait pas sans le travail de **[YAKUZA](https://x.com/Le__YAKUZA)** et de l'équipe **[Dofus Retro Tools](https://dofusretrotools.com)** : les 1492 ressources, 2203 items, 1451 monstres et toutes les icônes SVG viennent de leur API publique. Si vous jouez Dofus Retro, allez voir leur site, ils font un boulot dingue (carte interactive, simulateur de drop, encyclopédie complète).

- Site : [dofusretrotools.com](https://dofusretrotools.com)
- Twitter / X : [@Le__YAKUZA](https://x.com/Le__YAKUZA)
- Twitch : [twitch.tv/proyakuza](https://www.twitch.tv/proyakuza)

Code créateur Dofus officiel YAKUZA : `YAKUZA` — pensez à le spammer en jeu pour le soutenir gratuitement.

### Aussi merci à
- **[Ankama](https://www.ankama.com/)** pour Dofus, l'univers, les sprites des items / monstres / ressources.
- **[NVIDIA](https://build.nvidia.com)** qui héberge gratuitement les modèles vision Llama / Phi utilisés pour l'OCR.

Projet non-officiel, non affilié à Ankama ni à Dofus Retro Tools. Si YAKUZA ou Ankama souhaitent que ce projet soit retiré, ouvrez une issue ou contactez-moi.

## Licence

MIT — voir [`LICENSE`](./LICENSE). Données et icônes Dofus restent propriété de leurs ayants droit.
