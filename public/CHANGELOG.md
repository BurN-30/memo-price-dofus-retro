# Changelog

Toutes les modifs notables de Pénates (anciennement Memo Price). Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [0.6.2] — fix sidebar footer (icon-only, vrai cog) · 2026-04-27

### Corrigé
- **Boutons réglages/export/import débordaient** la sidebar (240px) avec SVG + label texte. Passage en **icon-only** : juste le SVG (16×16), label retiré, signification dans le `title` (tooltip natif). Beaucoup plus compact, lisible immédiatement, hover en cuivre.
- **Icône réglages** : mon ancien SVG (cercle + 8 traits radiaux) ressemblait à un soleil. Remplacé par un **vrai engrenage Lucide-style** (cercle central + path 8 dents). Sans ambiguïté.

## [0.6.1] — fix débordement summary dropdown · 2026-04-27

### Corrigé
- **Summary des dropdowns d'aide débordait à droite** quand le texte du titre était long (« Comment récupérer une clé NVIDIA NIM (gratuit, ~5 min) » par exemple). Cause : `display: flex` + text-node anonyme + chevron en margin-left auto = pas de shrink correct, le texte sortait du conteneur. Fix : passé en `display: block` avec chevron en `position: absolute` à droite. Le texte wrap naturellement sur plusieurs lignes si nécessaire, le chevron reste centré verticalement à droite.

## [0.6.0] — synchronisation entre appareils · 2026-04-27

### Ajouté
- **Synchronisation cloud entre appareils**, sans inscription, sans email, sans mot de passe.
- **Identifiant secret 32 caractères** (URL-safe base64) auto-généré à l'activation. Affiché dans Réglages avec bouton « Copier ». Sert d'unique preuve de propriété : aucun autre identifiant requis.
- **Activation en un clic** : Réglages → « Synchronisation entre appareils » → bouton **Activer la synchronisation**. Le compte est créé instantanément, les données locales sont push initialement.
- **Récupération sur un autre appareil** : Réglages → coller l'identifiant existant → bouton **Récupérer**. Les données distantes sont pull et remplacent les locales (avec confirmation si des données existent déjà).
- **Sync auto à chaque modification** (debounce 1.5s) — les prix saisis sur un appareil apparaissent au démarrage suivant sur l'autre.
- **Badge de statut** en bas de sidebar : ✓ (synchronisé), ⌛ (en cours), ✗ (échec). Tooltip explicite.
- **Déconnexion** : retire l'identifiant du navigateur courant, conserve les données locales et le compte distant. Reconnexion possible avec l'identifiant.
- **Suppression du compte** : efface le compte distant définitivement. Les données locales restent.
- **Avertissement sécurité** explicite à l'activation : conserver l'identifiant en lieu sûr (gestionnaire de mots de passe), sans lui pas de récupération depuis un autre appareil.

### Backend
- **Cloudflare D1 database** (`penates-sync`, region WEUR) avec tables `users` (id, created_at, last_seen_at) et `user_data` (user_id, blob_json, updated_at).
- **4 nouveaux endpoints Worker** : `POST /api/account/create`, `POST /api/sync/push`, `GET /api/sync/pull`, `DELETE /api/account/delete`.
- **Limite blob** : 200 KB par utilisateur (~30-50 KB typique).
- **Last-write-wins** sur la concurrence : si deux appareils modifient en même temps, la dernière modification gagne (suffisant pour notre usage).
- Free tier D1 (5 GB stockage, 5M reads/jour, 100k writes/jour) : large pour ~10 000 utilisateurs actifs.

### Sécurité
- L'identifiant secret est cryptographiquement aléatoire (24 bytes via `crypto.getRandomValues`) → espace ~10^57, bruteforce impossible.
- Aucune donnée personnelle (PII) collectée : pas d'email, pas d'IP loggée, pas de PnaJ.
- Rate limit 60 req/min/IP préservé (s'applique aussi aux endpoints sync).
- Code Worker open source, vérifiable sur le dépôt GitHub.

## [0.5.6] — onboarding clarifié + multi-device documenté · 2026-04-27

### Changé
- **CTA principal de l'onboarding inversé** : « Commencer » devient l'action primaire (bouton doré), « J'ai déjà une clé NVIDIA NIM, configurer maintenant » devient un lien discret en dessous. Avant, l'emphase sur « J'ai une clé → Réglages » faisait penser que la clé était obligatoire pour utiliser l'app.
- **Intro de l'onboarding enrichie** : précise explicitement que Pénates fonctionne directement sans inscription, et que l'OCR n'est qu'une option configurable plus tard.

### Ajouté
- **Nouveau dropdown « Sur plusieurs appareils ? »** dans l'onboarding : explique que les données sont par navigateur, sans synchronisation automatique. Pointe vers les boutons export / import existants. Mentionne qu'une sync cloud avec code de partage est envisagée à terme.

## [0.5.5] — polish UI : tooltip, modale, parchemin, lore · 2026-04-27

### Ajouté
- **I4 État vide illustré** : sceau de cire 180px en filigrane à 3.5% d'opacité derrière le texte. Donne du caractère sans nuire à la lisibilité.
- **I5 Tooltips harmonisés** : background gradient `bg-elev → bg-elev2`, ligne ornementale cuivre fade aux extrémités sous le nom, padding plus aéré, valeurs en JetBrains Mono. Étiquettes en SMALL CAPS.
- **P1 Animation modale d'entrée** : scale .97 → 1 + fade .22s cubic-bezier ease-out. Subtil, pas de gimmick sceau qui se brise.
- **P2 Texture parchemin** : noise SVG turbulence à 4.5% d'opacité en mix-blend overlay sur tous les `.modal-card`. Visible au focus, invisible au premier coup d'œil. Donne le grain « papier ancien ».
- **P3 Utility `.ornament-divider`** : filet cuivre + losange central, prêt à l'emploi pour les futures sections lore. Disponible dans toute l'app.
- **P5 Modale Réglages enrichie** : 3 nouveaux dropdowns mutuellement exclusifs :
  - **À propos de Pénates** : projet, lore, version, lien GitHub et changelog.
  - **Confidentialité et sécurité** : précise ce qui est en `localStorage`, ce qui transite, lien vers le code Worker.
  - **Crédits** : YAKUZA, Dofus Retro Tools, Ankama, NVIDIA. Code créateur YAKUZA mis en avant.
- Modale Réglages élargie de 420px à 480px pour accommoder.

### Corrigé
- « Obtiens une clé » → « Obtenir une clé » dans le hint Réglages (ton impersonnel).
- « ton navigateur » → « le navigateur » (ton impersonnel).

## [0.5.4] — fix overlap OCR mini-widget vs toast · 2026-04-27

### Corrigé
- Le widget OCR mini (session OCR en arrière-plan) et le toast de notification étaient tous deux positionnés en `bottom: 20px; right: 20px`. Quand les deux apparaissaient simultanément, le toast cachait le widget OCR. Le widget OCR passe en `bottom-left` (z-index identique 50), le toast reste en `bottom-right` (z-index 60). Plus de chevauchement.

## [0.5.3] — modale Craft footer dramatique · 2026-04-27

### Changé
- **Coût total** : agrandi de 22px à **30px** (font-size), placé en position dominante. C'est l'info principale, elle se lit en premier.
- **Pill « X manquants · estimation incomplète »** rouge discrète, en ligne avec le coût total (au lieu d'une `sub` perdue en dessous). Ne s'affiche que si l'estimation est incomplète.
- **Footer avec gradient** subtil `--bg-elev` → `--bg`, padding plus aéré (18×22 vs 14×18), gap 24px entre blocs.
- **Bouton primary** : `Suivre ce craft` / `Mettre à jour` (sans flèche `→` superflue), height 42px, padding 22px (plus présent).
- **Bouton OCR par ingrédient** : emoji `📷` remplacé par SVG camera inline (cohérent palette, rendu OS-agnostique).

### Corrigé
- Étiquettes en SMALL CAPS plus serrées (letter-spacing .12em vs .1em) et mieux espacées des valeurs (gap 4px vs 2px).

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
