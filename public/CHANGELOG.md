# Changelog

Toutes les modifs notables de Pénates (anciennement Memo Price). Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [0.4.0] — cloud edition · 2026-04-27

### Changé
- **Rebrand** : Memo Price devient **Pénates**, en référence à la *Confrérie des Pénates* du lore Dofus, organisation dédiée à la préservation de la connaissance.
- **Migration cloud** : l'app n'est plus servie par un serveur Python local, mais hébergée sur Cloudflare Workers. Plus besoin de lancer `lancer.bat` / `python serve.py` — accès direct via le site.
- **Clé NIM côté browser** : la clé NVIDIA NIM est désormais dans le `localStorage` du navigateur (et non plus dans `config.json` côté serveur). Chaque utilisateur garde sa clé sur sa machine ; le Worker la transmet à NIM uniquement le temps de l'OCR.

### Ajouté
- **Onboarding première fois** : à la première visite (sans clé NIM), un écran d'accueil propose de configurer NIM ou de continuer sans OCR.
- **Bouton « Tester la clé »** dans Réglages : valide la clé en envoyant un appel minimal à NIM, retour visuel ✓ vert / ✗ rouge.
- **Accordéon guide NIM** : marche à suivre détaillée pour récupérer une clé gratuite sur `build.nvidia.com`.
- **Logo sceau de cire** : le `⟡` est remplacé par un sceau circulaire monogramme `P` (cire bordeaux + bordure cuivre), plus aligné avec l'identité « archive de la confrérie ».
- **Tagline** « Préserve la connaissance des prix. » sous le titre.
- **Rate-limit IP** côté Worker (60 req/min) pour éviter les abus.

### Supprimé
- Auto-update intégrée (`/api/check-update`, `/api/update`) — remplacée par auto-deploy Cloudflare au push GitHub.
- Endpoint `/api/config` (clé NIM serveur) — remplacé par `localStorage` browser.
- Scripts de lancement local (`lancer.bat`, `lancer.sh`, `stop.bat`, `stop.sh`).
- Modal « Mise à jour disponible » et overlay de redémarrage.

## [0.3.0] — 2026-04-26

### Ajouté
- **Section « Crafts suivis »** dans la sidebar : nouveau dossier spécial qui liste les items que tu suis avec coût ingrédients computé live, prix HDV éditable inline, et marge nette colorée (vert/rouge).
- Coût d'un craft préfixé `~` et dans une couleur différente quand au moins un prix d'ingrédient est manquant — l'estimation est mise en évidence comme telle.
- Header colonnes en SMALL CAPS sur la vue crafts (`ITEM · QTÉ · COÛT INGRÉDIENTS · PRIX HDV · MARGE`).
- Foot de la modale Craft restructuré en 3 blocs (Coût ingrédients, Prix HDV, Marge nette) avec gros chiffres mono dorés/cuivre + sub-text d'avertissement si estimation incomplète.
- Bouton « suivre ce craft » / « mettre à jour » / « retirer du suivi » dans la modale Craft.
- Stats globales sur la vue Crafts : `coût total → HDV total (marge totale)`.

### Modifié
- README en préambule : mention explicite « 100% local, pas de partage » + section « Prérequis » mise en avant + tutoriel détaillé pour récupérer une clé NIM.
- Section « Remerciements » conséquente créditant YAKUZA et l'équipe Dofus Retro Tools (auteurs de la base de données utilisée).

## [0.2.0] — 2026-04-26

### Ajouté
- **Auto-update intégrée** : badge à côté de la version quand une nouvelle est dispo sur GitHub. Click → modal avec liste des commits + lien diff GitHub + warning sécurité. Bouton « Mettre à jour » fait un `git pull` puis redémarre le serveur, page rechargée auto.
- **Picker d'icône** pour les dossiers : 3 onglets (texte/emoji, ressource du catalogue, monstre du bestiaire). Plus besoin de se contenter d'emojis.
- **Bulk parser multi-tokens** : gère les lignes type `Sac patate clair 110/u 1600/10` — extrait toutes les variantes prix, prend la `/u` en priorité, montre `+1 alt.` pour les autres.
- **Sidebar rétractable** (état persisté).
- **OCR multi-image** : drop plusieurs captures, file d'attente, modal réduisible en widget flottant + toast de notification quand le batch est terminé.
- **Astuce x10 conditionnelle** : si vendre en lot rapporte ≥15% de plus par unité, suggestion discrète masquable par item.
- README enrichi : préambule local-first / prérequis explicites / section remerciements (YAKUZA, Dofus Retro Tools, Ankama).

### Modifié
- Default OCR : `meta/llama-3.2-11b-vision-instruct` (3-5× plus rapide), avec fallback auto sur `90b` en cas d'échec ou JSON invalide.
- Compression image client-side avant envoi NIM (resize 1280px max, JPEG q.85) — règle le 502 sur les captures > 180 KB.
- Suppression des emojis colorés des boutons / titres / hints (préférence UI plus pro). Boutons toolbar : `txt` / `OCR` / `craft`.
- Palette dark marron/cuivre, police Inter pour la lisibilité.

### Corrigé
- Bug `[hidden]` sur les modals/toast/widget (régression CSS sur `display: flex` qui ignorait l'attribut HTML `hidden`). Règle globale `[hidden] { display: none !important; }` ajoutée.
- `recipeOcrTarget` qui restait collé après une fermeture sans apply → pouvait diriger un OCR ultérieur vers le mauvais ingrédient.
- Layout grid des rows qui pouvait collapser le nom à 38px (`minmax(0, 1fr)` explicite).
- Fond dégradé qui ne couvrait pas toute la hauteur sur écran zoomé / contenu court.

## [0.1.0] — 2026-04-26

Première version publique.

### Ajouté
- Catalogue intégré : 1492 ressources, 2203 items craftables, 1451 monstres (issu de [DofusRetroTools](https://dofusretrotools.com)).
- Prix éditables inline avec format K/M, total auto par dossier, stamp de dernière mise à jour discret.
- **Dossiers de farm** personnalisables (Craq, Blop, AS, AA, Forgeron pré-remplis), icônes mob/ressource au choix.
- **txt** (bulk) : coller une liste de prix → matching fuzzy + aliases (`eco. abra s.`, `bourg`, `craq`, `kriptonite`, etc.).
- **OCR HDV** via NVIDIA NIM (modèles `llama-3.2-11b-vision-instruct` ou `90b`, fallback automatique). Multi-image avec file d'attente, modal réduisible en widget flottant + notif quand le batch est terminé.
- **Craft** : recherche d'un item à crafter, calcul du coût total, prix manquants surlignés, OCR rapide sur ligne manquante.
- **Astuce x10** discrète quand vendre en lot rapporte +15% par unité (masquable par item).
- Sidebar rétractable (état persisté).
- Import/export JSON des dossiers et prix.

### Sécurité & confidentialité
- Aucune donnée n'est envoyée hors de chez vous, sauf les images explicitement OCR (vers NIM).
- Prix, dossiers et préférences stockés en `localStorage` browser, jamais dans le repo.
- Clé API NIM stockée localement dans `config.json` (ignoré par git).
