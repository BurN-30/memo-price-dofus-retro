# Changelog

Toutes les modifs notables de Memo Price. Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

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
