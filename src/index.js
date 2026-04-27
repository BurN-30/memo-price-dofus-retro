/**
 * Pénates · Worker entrypoint
 *
 * Routes
 *   POST /api/ocr     — proxy NVIDIA NIM avec clé fournie par le browser (localStorage)
 *   GET  /api/health  — healthcheck JSON
 *   *                 — static assets via env.ASSETS (binding configuré dans wrangler.toml)
 *
 * Contrat /api/ocr
 *   Body  : { image_b64, mime?, model?, no_fallback?, nim_key }
 *   200   : { ok: true, data: {...}, model, fallback_used, primary }
 *   400   : { error }
 *   429   : { error: "Trop de requêtes..." }
 *   502   : { error, details? }
 *
 * Aucune donnée stockée côté Worker. La clé NIM transite uniquement le temps du forward.
 */

const NIM_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const DEFAULT_MODEL = 'meta/llama-3.2-11b-vision-instruct';
const FALLBACK_MODEL = 'meta/llama-3.2-90b-vision-instruct';
const NIM_TIMEOUT_MS = 45_000;
const RATE_LIMIT_PER_MIN = 60;

const PROMPT = `Tu reçois une capture d'écran de la fiche d'un objet à l'HDV (Hôtel des Ventes) de Dofus Retro. Extrais EXACTEMENT les informations affichées et réponds UNIQUEMENT avec un JSON valide (sans markdown, sans texte autour) selon ce schéma :
{
  "name": "<nom de l'objet exact, avec accents>",
  "level": <int ou null>,
  "pods": <int ou null>,
  "price_x1": <int ou null>,
  "price_x10": <int ou null>,
  "price_x100": <int ou null>,
  "avg_per_unit": <int ou null>,
  "lot_quantity": <int ou null>,
  "lot_price": <int ou null>
}
Règles :
- Ignore les espaces dans les nombres (ex: '7 998' devient 7998).
- 'Prix moyen : 78 kamas/u.' → avg_per_unit = 78.
- Le tableau a 3 colonnes (x1, x10, x100). Récupère le prix le plus bas affiché de chaque colonne.
- Si une info n'apparaît pas, mets null. Aucune information inventée.
- Le nom doit être strictement le nom de l'item (pas 'Niv.X', pas '5 pods').`;

// Rate limit en mémoire isolate. Réinitialisé au cold start, c'est suffisant pour notre usage.
const rateLimitMap = new Map();

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  entry.count += 1;
  return entry.count <= RATE_LIMIT_PER_MIN;
}

function extractJson(text) {
  if (!text) return null;
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }
  try { return JSON.parse(cleaned); } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

async function tryNim(b64, model, key, mime) {
  const payload = {
    model,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: PROMPT },
        { type: 'image_url', image_url: { url: `data:${mime};base64,${b64}` } },
      ],
    }],
    temperature: 0,
    max_tokens: 600,
  };

  let resp;
  try {
    resp = await fetch(NIM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(NIM_TIMEOUT_MS),
    });
  } catch (e) {
    return { parsed: null, raw: String(e), error: e.name === 'TimeoutError' ? 'Timeout NIM' : `Network: ${e.message || e}` };
  }

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    return { parsed: null, raw: body.slice(0, 600), error: `NIM HTTP ${resp.status}` };
  }

  let data;
  try { data = await resp.json(); }
  catch (e) { return { parsed: null, raw: 'malformed JSON', error: 'malformed NIM response' }; }

  let content;
  try { content = data.choices[0].message.content; }
  catch { return { parsed: null, raw: JSON.stringify(data).slice(0, 400), error: 'malformed NIM response' }; }

  const parsed = extractJson(content);
  if (!parsed || typeof parsed !== 'object') {
    return { parsed: null, raw: content.slice(0, 400), error: 'NIM JSON invalide' };
  }
  return { parsed, raw: content, error: null };
}

async function handleOcr(request) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!checkRateLimit(ip)) {
    return jsonResponse({ error: 'Trop de requêtes. Réessaie dans 1 min.' }, 429);
  }

  let body;
  try { body = await request.json(); }
  catch (e) { return jsonResponse({ error: `bad json: ${e.message}` }, 400); }

  const b64 = body.image_b64;
  if (!b64) return jsonResponse({ error: 'no image_b64' }, 400);

  const key = (body.nim_key || '').trim();
  if (!key) return jsonResponse({ error: 'Pas de clé NIM. Ouvre Réglages et entre ta clé NVIDIA NIM.' }, 400);

  const mime = body.mime || 'image/png';
  const primary = (body.model || DEFAULT_MODEL).trim();
  const fallback = FALLBACK_MODEL;
  const noFallback = !!body.no_fallback;

  let { parsed, raw, error } = await tryNim(b64, primary, key, mime);
  let usedModel = primary;
  let fallbackUsed = false;

  if (!parsed && !noFallback && fallback !== primary) {
    const fb = await tryNim(b64, fallback, key, mime);
    if (fb.parsed) {
      parsed = fb.parsed;
      raw = fb.raw;
      error = null;
      usedModel = fallback;
      fallbackUsed = true;
    }
  }

  if (!parsed) {
    return jsonResponse({ error: error || 'Échec NIM', details: raw }, 502);
  }

  return jsonResponse({
    ok: true,
    data: parsed,
    model: usedModel,
    fallback_used: fallbackUsed,
    primary,
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/health') {
      return jsonResponse({ ok: true });
    }

    if (path === '/api/ocr' && request.method === 'POST') {
      return handleOcr(request);
    }

    if (path.startsWith('/api/')) {
      return jsonResponse({ error: 'Unknown endpoint' }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};
