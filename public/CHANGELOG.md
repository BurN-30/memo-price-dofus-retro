# Changelog

Toutes les modifs notables de Pénates (anciennement Memo Price). Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [0.5.2] — carte résultat OCR refaite · 2026-04-27

### Corrigé
- **Bug de palette** : la card de prix sélectionnée avait un fond `rgba(183,140,255,.1)` (mauve violet, étranger à la palette Pénates). Remplacé par `rgba(212,154,92,.12)` (cuivre subtle), avec un check SVG doré en haut à droite pour marquer la sélection.

### Ajouté
- **Labels SMALL CAPS** sur les sections du résultat OCR :
  - « Prix extraits HDV » au-dessus des rangées x1/x10/x100.
  - « Prix moyen conseillé » au-dessus du gros chiffre doré (au lieu de simplement « Prix moyen »).
  - « Choisir le prix de référence » au-dessus des cards x1/x10/x100/Moyen.
- **Check SVG doré** sur la card de prix sélectionnée (coin haut-droit, plus lisible que la simple bordure).

### Changé
- **Astuce x10** refondue : encart `border-left` doré à gauche, fond `--gold` à 6% (au lieu du `--accent` à 5%), icône SVG flèche-droite au lieu du `›` Unicode. Plus visible et plus aligné avec le ton « tip / conseil ».
- **Card de prix au hover** : passe en `--accent-2` + `--bg-hover` (au lieu de juste changer la border).

## [0.5.1] — glyphes Unicode → SVG inline · 2026-04-27

### Changé
Remplacement systématique des glyphes Unicode peu lisibles par des SVG inline propres :

- **`‹` btn-collapse** → SVG chevron-left avec rotation 180° au repli (CSS pur, plus de manipulation `textContent` côté JS).
- **`⚙` réglages** → SVG cog (cercle + 8 traits radiaux).
- **`⇩` export** → SVG flèche bas + ligne (style "download to disk").
- **`⇧` import** → SVG flèche haut + ligne (style "upload from disk").
- **`✎` renommer** (header dossier) → SVG crayon, identique au bouton edit des Crafts.
- **`⌕` loupe** dans le champ de recherche → SVG inline via `data:image/svg+xml`, couleur `--text-mute`.
- **`⚙ Réglages`** dans le titre de la modale → simplement `Réglages` (le SVG du bouton suffit).

Bénéfices : rendu identique sur tous les OS (plus de variations Windows/Mac/Linux selon la police de fallback), aliasing propre en haute résolution, couleurs via `currentColor` cohérentes avec la palette.

## [0.5.0] — vue Crafts suivis stylée · 2026-04-27

### Ajouté
- **Icône SVG enclume** pour le header de la vue « Crafts suivis » (remplace le glyphe Unicode `⚒` peu lisible).
- **Icône SVG losange ornemental** pour le header de la vue « Tous mes prix » (cohérent avec le folder header de la sidebar).
- **Stat global colorée** dans le header : flèche cuivre `→` entre coût et HDV, et marge colorée vert (`--good`) si positive ou rouge (`--danger`) si négative, le tout en JetBrains Mono.
- **Boutons d'action SVG** sur chaque ligne de craft : crayon pour éditer, croix pour retirer (remplace les glyphes `⌗` et `×`).

### Changé
- **État vide « Aucun craft suivi »** reformulé en ton impersonnel et plus engageant.
- **Bloc `.empty`** : padding plus généreux, max-width pour limiter la longueur de ligne, marge auto pour centrage propre.

## [0.4.9] — onboarding compact (zéro scroll) · 2026-04-27

### Changé
- **Tous les dropdowns d'onboarding raccourcis** pour rentrer dans une viewport standard (1080p, 900p) sans avoir à scroller, même quand un est ouvert. Plus dense, moins verbeux.
- **Padding et marges resserrés** sur la card d'onboarding (28×36 au lieu de 36×44, h2 22px, intro 12.5px). Le contenu rentre maintenant en hauteur.
- **Phrasé condensé** dans tous les dropdowns : suppression des doubles formulations, raccourcis acceptés (~, /, ex., niv).

## [0.4.8] — rédaction « Pourquoi Pénates ? » · 2026-04-27

### Changé
- **Dropdown « Pourquoi Pénates ? » réécrit** :
  - Cadrage du projet recadré : ce n'est pas « en revenant sur Retro » (formulation imprécise), mais une particularité du jeu en 1.29 (pas de prix moyen sur l'HDV, contrairement à d'autres versions). Décrit clairement le pain point.
  - Plus de tournures comme « en mieux » qui sonnaient pub.
  - Section nom recadrée : remplacé « Métaphore directe » par une transition narrative qui lie les Pénates romains au memo de prix.
  - Section Dofus : retiré « évidemment » qui supposait le savoir du lecteur, structuré en : (1) la zone, (2) le donjon, (3) le boss et la fable de La Fontaine.

## [0.4.7] — animation dropdowns · 2026-04-27

### Ajouté
- **Animation d'ouverture/fermeture des dropdowns** : transition fluide block-size 0 → auto + fade opacity (280ms ease) via `::details-content` + `interpolate-size: allow-keywords` (technique CSS moderne 2024). Plus de coupe brusque.
- **Fallback `@supports not (interpolate-size)`** : sur les browsers sans support, ouverture instantanée comme avant (pas d'animation cassée).

## [0.4.6] — onboarding plus large · 2026-04-27

### Changé
- **Card d'onboarding élargie** : `max-width` 480px → 600px, padding horizontal 38 → 44px. Évite les lignes qui se chevauchent dans les dropdowns ouverts (ex. listes des étapes NIM, raccourcis clavier capture).

## [0.4.5] — dropdowns mutuellement exclusifs · 2026-04-27

### Ajouté
- **Attribut `name="onboarding-faq"`** sur les 4 `<details>` de l'onboarding : ouvrir un dropdown ferme automatiquement les autres (pure HTML natif, supporté par tous les browsers modernes depuis 2024). Plus besoin de scroller dans la modale, l'expérience reste compacte.
- **`max-height: calc(100vh - 40px)` + `overflow-y: auto`** sur la card d'onboarding au cas où le contenu dépasse encore l'écran (petits écrans, dropdown très long).

## [0.4.4] — UX dropdowns onboarding · 2026-04-27

### Changé
- **Dropdowns onboarding refondus** pour être visiblement cliquables :
  - Summary plus présent : font-weight 600, font-size 13px, color `--text` (au lieu de `--text-soft`).
  - Padding 13px 16px (vs 10px 14px).
  - Chevron SVG (cuivre) à droite, animation rotation 180° à l'ouverture (vs petit `▸` à gauche peu visible).
  - Container : gradient subtle bg-elev2 → bg-elev pour donner du relief.
  - Hover : border passe en `--accent-2`, background `--bg-hover`, color `--accent-3`, chevron passe à opacity 1.
  - State open : border `--accent-2`, ombre douce, séparateur sous le summary, fond légèrement teinté cuivre.

## [0.4.3] — onboarding humanisé et factuel · 2026-04-27

### Ajouté
- **Dropdown « Pourquoi Pénates ? »** dans l'onboarding : présente le projet (memo né d'un manque sur Retro), explique le nom (Pénates romains, divinités protectrices du foyer), et le clin d'œil Dofus (Pénates du Corbac, Confrérie de la connaissance, La Fontaine).
- **Dropdown « Quoi capturer, et comment »** : explique précisément ce qu'il faut capturer (fenêtre de l'item HDV avec les 3 colonnes de prix), et comment, en utilisant les outils intégrés à Windows (`Win+Shift+S`), macOS (`Cmd+Shift+4`), Linux (`Print Screen`). Pas besoin d'outil tiers comme ShareX.
- **Style `<kbd>`** pour les raccourcis clavier (encart relief discret).

### Changé
- **Fiche « L'OCR, qu'est-ce que c'est ? »** convertie en dropdown (collapsed par défaut). Définition factuelle, sans métaphore enfantine. Précision explicite : l'IA est utilisée uniquement pour la lecture des captures, aucun autre usage.
- **Tuto NVIDIA NIM** : ton informatif et impersonnel, pas de tutoiement, plus de raccourcis (« retry », « ~5 min » remplacé par « réessayer », « environ 5 min »).
- **Tirets cadratins (`—`)** retirés des contenus en prose (UI, messages, meta description). Conservés dans les placeholders d'inputs où ils servent d'indicateur d'absence de valeur.

## [0.4.2] — onboarding pédagogique · 2026-04-27

### Ajouté
- **Fiche "C'est quoi l'OCR ?"** dans l'onboarding : explication simple ("photo d'un panneau lue automatiquement"), exemple concret du flow Pénates (capture HDV → OCR → prix remplis), et précision explicite sur l'usage UNIQUE de l'IA (pas de génération texte, pas d'analyse données, juste lecture des chiffres sur captures).
- **Avertissement vérification téléphone** dans le tuto NVIDIA (encart rouge discret) : le numéro de téléphone est requis et les serveurs NVIDIA sont parfois saturés.
- **Mention sécurité enrichie** : clé en `localStorage` browser, jamais stockée serveur, lien vers le code source GitHub pour vérification.

### Changé
- **Tuto NVIDIA réécrit** avec la procédure réelle 2026 : `build.nvidia.com/?modal=signin` (plus de page "modèle"), création compte NVIDIA Cloud (nom au choix), vérification téléphone, page `/settings/api-keys`, génération API Key avec nom au choix. Plus de mention obsolète de "Get API Key sur le modèle".
- **Bouton primary** : gradient diagonal flashy → vertical doux, ombre divisée par 3, hover plus subtil. Plus aligné avec l'identité archive.
- **Bouton onboarding** : fix conflit `height` vs `padding` qui décalait visuellement le contenu.

## [0.4.1] — identité Pénates · 2026-04-27

### Ajouté
- **EB Garamond** chargé depuis Google Fonts pour le wordmark "Pénates" et les titres lore (style archive d'érudit, pas grimoire fantasy).
- **Variables CSS Pénates** : `--seal #8b3a2f` (cire bordeaux), `--seal-deep #621f17`, `--seal-light #a0463a`, `--ink #1a0f08`.
- **Logo sceau de cire** maturé : gradient radial, double bordure (cuivre extérieur + intérieur sombre), "P" en EB Garamond italique. Versions 32px (sidebar) et 72px (onboarding).
- **Favicon** : sceau bordeaux + monogramme "P" en SVG.
- **Meta description** pour le partage social.

### Changé
- **Wordmark "Pénates"** dans la sidebar : Inter → EB Garamond italique 22px.
- **Tagline "Préserve la connaissance des prix"** : EB Garamond italique, contraste légèrement remonté.
- **Glyphes Unicode → SVG inline** sur les éléments les plus visibles : header de dossier (◇ → losange ornemental), zone de drop OCR (⤓ → flèche upload), widget OCR réduit (⌗ → document). Plus consistent cross-OS.

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
