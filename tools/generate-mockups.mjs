// Génère les 5 mockups Stitch pour Pénates via @google/stitch-sdk.
// Lance avec : STITCH_API_KEY=... node tools/generate-mockups.mjs
import { stitch } from "@google/stitch-sdk";
import fs from "node:fs/promises";
import path from "node:path";

const PROMPTS = [
  {
    name: "04-onboarding",
    prompt: `Single-screen first-time onboarding for "Pénates", a Dofus Retro 1.29 price-tracking webapp. Background #14100c with subtle radial-gradient amber glow top-left and bottom-right (rgba(212,154,92,0.06)). Centered card 480px wide on #1f1812 with #3a2c20 border, 12px radius, soft shadow. Top of card: round wax-seal logo 64px with monogram "P" in copper/bordeaux. Below: serif title "Bienvenue dans Pénates" (EB Garamond, 24px, #ede2d0), italic tagline "Préserve la connaissance des prix" in #b39c80. Then a collapsed accordion "Comment récupérer une clé NVIDIA NIM ?" with chevron, copper accent #d49a5c on hover. Two CTA buttons stacked: primary "J'ai une clé → Réglages" (gradient #e8b97a→#b87a3d, dark text), secondary "Continuer sans OCR" (ghost, copper border). Bottom: tiny version "v0.4.0" in JetBrains Mono #7a6450. Tone: clean librarian archive, NOT fantasy.`,
  },
  {
    name: "05-settings",
    prompt: `Settings modal for "Pénates" (Dofus Retro price tracker). 420px wide modal on #14100c blurred backdrop, card #1f1812 with #3a2c20 border, 10px radius. Header bar: title "Réglages" (Inter 15px 700) + close X. Inside: section block 1 "API NVIDIA NIM" (small-caps label #7a6450 letter-spacing 0.08em). Password input full-width, dark #2a1f17, copper focus ring. Right of input: a "Tester" button (secondary, copper border, 32px height) — when pressed shows ✓ green or ✗ red badge inline with one-line message in #b3c87a or #d97562. Below: hint "Obtiens une clé sur build.nvidia.com" with the URL underlined copper #d49a5c, opens in new tab. Section block 2 "Modèle vision" with native select dropdown listing Llama 3.2 11B / 90B / Phi-4 / Personnalisé, full-width #2a1f17. Footer: single primary save button right-aligned in copper gradient. Inter font, JetBrains Mono for placeholder "nvapi-…". Tone: archivist's tool panel.`,
  },
  {
    name: "06-crafts",
    prompt: `Main panel for "Pénates" Dofus Retro price tracker, Crafts suivis view. Left sidebar 240px #1f1812 with folder list, "Crafts suivis" entry highlighted copper gradient. Main area #14100c. Top: anvil icon copper #d49a5c + title "Crafts suivis" Inter 22px 700, right stats "8 crafts cout 142K HDV 198K marge +56K" JetBrains Mono gold #f2c478. Panel #1f1812 with column headers small-caps #7a6450, 5 rows alternating #1c1611/#1f1813, each 56px: item icon, name uppercase, qty stepper, cost gold mono, HDV input, margin green or red. Tone: archivist merchant ledger.`,
  },
  {
    name: "07-ocr-v2",
    prompt: `Modal for Pénates app showing image-to-price OCR result. 880px wide on dark #14100c blurred backdrop. Modal card #1f1812 with copper border-top, rounded. Header has title and close icon. Body has dashed dropzone area, status line, primary copper button. One result card with item icon, name, green ready pill. Below split in 2 columns: left list of three small mono prices, right one big gold number large mono. Bottom row of 4 selectable price cards, last one selected with copper border. Tone: archive ledger.`,
  },
  {
    name: "08-about",
    prompt: `About screen for Pénates, Dofus Retro 1.29 price tracker. Full panel #14100c with subtle parchment noise. Centered column 640px. Top: large round wax-seal logo 96px, bordeaux #8b3a2f wax, copper #d49a5c thin border, monogram P engraved EB Garamond serif. Below: title "Confrérie des Pénates" EB Garamond 32px #ede2d0, italic subtitle "Préserve la connaissance des prix" #b39c80. Card #1f1812 #3a2c20 border, 24px padding: 3 short paragraphs about lore, mission, credits. Inter 14px #b39c80. Mini-stats line "1492 ressources 2203 items 1451 monstres" JetBrains Mono #d49a5c. Footer copper divider, version v0.4.0. Tone: dignified archive.`,
  },
];

const OUT_DIR = path.join(process.cwd(), "stitch-mockups");

async function main() {
  if (!process.env.STITCH_API_KEY) {
    throw new Error("STITCH_API_KEY manquante. Lance avec : STITCH_API_KEY=... node tools/generate-mockups.mjs");
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  console.log("Création du projet Stitch...");
  const project = await stitch.createProject("Pénates · Memo HDV Dofus Retro");
  console.log(`  → projet ${project.id}`);

  const MAX_RETRY = 3;
  const failed = [];

  for (const { name, prompt } of PROMPTS) {
    const outPath = path.join(OUT_DIR, `${name}.png`);
    try {
      const stat = await fs.stat(outPath);
      if (stat.size > 1000) {
        console.log(`\n[${name}] déjà présent (${(stat.size / 1024).toFixed(1)} KB), skip.`);
        continue;
      }
    } catch {}

    let success = false;
    for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
      try {
        console.log(`\n[${name}] tentative ${attempt}/${MAX_RETRY}…`);
        const screen = await project.generate(prompt);
        const imageUrl = await screen.getImage();
        const resp = await fetch(imageUrl);
        if (!resp.ok) throw new Error(`download HTTP ${resp.status}`);
        const buffer = Buffer.from(await resp.arrayBuffer());
        await fs.writeFile(outPath, buffer);
        console.log(`  ✓ ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
        success = true;
        break;
      } catch (e) {
        console.log(`  ✗ ${e.message}`);
        if (attempt < MAX_RETRY) {
          const delay = 3000 * attempt;
          console.log(`  ⌛ retry dans ${delay / 1000}s…`);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    if (!success) failed.push(name);
  }

  if (failed.length === 0) {
    console.log("\n✓ Tous les mockups générés.");
  } else {
    console.log(`\n⚠ ${failed.length} échec(s) : ${failed.join(", ")}`);
    console.log("Relance le script pour retry les manquants.");
    process.exit(2);
  }
}

main().catch((e) => {
  console.error("✗ Erreur :", e.message);
  if (e.stack) console.error(e.stack);
  process.exit(1);
});
