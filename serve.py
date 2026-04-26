"""Memo Price · Dofus Retro

Lance un mini-serveur HTTP qui sert l'app et fait proxy vers NVIDIA NIM
pour l'OCR des screenshots HDV. La clé API NIM est sauvée dans config.json
(local, jamais envoyée au browser).

Usage:
    python serve.py            # lance et ouvre le browser
    python serve.py --no-open  # lance sans ouvrir
    MEMO_PRICE_PORT=9000 python serve.py
"""
import http.server
import socketserver
import json
import os
import re
import sys
import threading
import urllib.request
import urllib.error
import webbrowser
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse

PORT = int(os.environ.get('MEMO_PRICE_PORT', '8765'))
ROOT = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(ROOT, 'config.json')
NIM_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'
DEFAULT_MODEL = 'meta/llama-3.2-11b-vision-instruct'
FALLBACK_MODEL = 'meta/llama-3.2-90b-vision-instruct'
NIM_TIMEOUT = 45  # secondes

PROMPT = (
    "Tu reçois une capture d'écran de la fiche d'un objet à l'HDV (Hôtel des Ventes) de Dofus Retro. "
    "Extrais EXACTEMENT les informations affichées et réponds UNIQUEMENT avec un JSON valide "
    "(sans markdown, sans texte autour) selon ce schéma :\n"
    "{\n"
    '  "name": "<nom de l\'objet exact, avec accents>",\n'
    '  "level": <int ou null>,\n'
    '  "pods": <int ou null>,\n'
    '  "price_x1": <int ou null>,\n'
    '  "price_x10": <int ou null>,\n'
    '  "price_x100": <int ou null>,\n'
    '  "avg_per_unit": <int ou null>,\n'
    '  "lot_quantity": <int ou null>,\n'
    '  "lot_price": <int ou null>\n'
    "}\n"
    "Règles :\n"
    "- Ignore les espaces dans les nombres (ex: '7 998' devient 7998).\n"
    "- 'Prix moyen : 78 kamas/u.' → avg_per_unit = 78.\n"
    "- Le tableau a 3 colonnes (x1, x10, x100). Récupère le prix le plus bas affiché de chaque colonne.\n"
    "- Si une info n'apparaît pas, mets null. Aucune information inventée.\n"
    "- Le nom doit être strictement le nom de l'item (pas 'Niv.X', pas '5 pods')."
)


def load_config():
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_config(cfg):
    with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
        json.dump(cfg, f, indent=2, ensure_ascii=False)


def call_nim(image_b64, model, key, image_mime='image/png'):
    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": PROMPT},
                    {"type": "image_url", "image_url": {"url": f"data:{image_mime};base64,{image_b64}"}}
                ]
            }
        ],
        "temperature": 0,
        "max_tokens": 600
    }
    req = urllib.request.Request(
        NIM_URL,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {key}',
            'Accept': 'application/json',
        },
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=NIM_TIMEOUT) as r:
        return json.loads(r.read().decode('utf-8'))


def extract_json(text):
    """Trouve le premier objet JSON dans une réponse LLM (peut contenir du markdown)."""
    if not text:
        return None
    try:
        return json.loads(text)
    except Exception:
        pass
    m = re.search(r'\{[\s\S]*\}', text)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            pass
    return None


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stdout.write("%s · %s\n" % (self.address_string(), fmt % args))

    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/api/config':
            return self.handle_get_config()
        if path == '/api/health':
            return self.write_json({'ok': True})
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        if path == '/api/config':
            return self.handle_set_config()
        if path == '/api/ocr':
            return self.handle_ocr()
        self.send_error(404, 'Unknown endpoint')

    def read_json(self, max_mb=20):
        n = int(self.headers.get('Content-Length', '0'))
        if n > max_mb * 1024 * 1024:
            raise ValueError('payload too large')
        return json.loads(self.rfile.read(n).decode('utf-8'))

    def write_json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def handle_get_config(self):
        cfg = load_config()
        self.write_json({
            'has_key': bool(cfg.get('nim_key')),
            'model': cfg.get('model', DEFAULT_MODEL),
        })

    def handle_set_config(self):
        try:
            d = self.read_json()
        except Exception as e:
            return self.write_json({'error': f'bad json: {e}'}, 400)
        cfg = load_config()
        if 'nim_key' in d:
            k = (d['nim_key'] or '').strip()
            if k:
                cfg['nim_key'] = k
            else:
                cfg.pop('nim_key', None)
        if 'model' in d and d['model']:
            cfg['model'] = d['model']
        save_config(cfg)
        return self.write_json({'ok': True, 'has_key': bool(cfg.get('nim_key')), 'model': cfg.get('model', DEFAULT_MODEL)})

    def try_nim(self, b64, model, key, mime):
        """Tente un appel NIM. Renvoie (parsed_dict, raw_content_or_error_str, error_str_or_None)."""
        try:
            resp = call_nim(b64, model, key, image_mime=mime)
        except urllib.error.HTTPError as e:
            try: body = e.read().decode('utf-8')
            except Exception: body = str(e)
            return None, body[:600], f'NIM HTTP {e.code}'
        except urllib.error.URLError as e:
            return None, str(e.reason), f'Network: {e.reason}'
        except Exception as e:
            return None, str(e), str(e)
        try:
            content = resp['choices'][0]['message']['content']
        except Exception:
            return None, str(resp)[:400], 'malformed NIM response'
        cleaned = content.strip()
        if cleaned.startswith('```'):
            cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
            cleaned = re.sub(r'\s*```$', '', cleaned)
        parsed = extract_json(cleaned)
        if not isinstance(parsed, dict):
            return None, content[:400], 'NIM JSON invalide'
        return parsed, content, None

    def handle_ocr(self):
        try:
            d = self.read_json()
        except Exception as e:
            return self.write_json({'error': f'bad json: {e}'}, 400)
        b64 = d.get('image_b64')
        if not b64:
            return self.write_json({'error': 'no image_b64'}, 400)
        mime = d.get('mime') or 'image/png'
        cfg = load_config()
        key = cfg.get('nim_key')
        if not key:
            return self.write_json({'error': "Pas de clé NIM. Ouvre Réglages et entre ta clé NVIDIA NIM."}, 400)
        primary = (d.get('model') or cfg.get('model') or DEFAULT_MODEL).strip()
        fallback = (cfg.get('fallback_model') or FALLBACK_MODEL).strip()
        no_fallback = bool(d.get('no_fallback'))
        approx_kb = round(len(b64) * 0.75 / 1024, 1)
        print(f"[OCR] {primary} · image {approx_kb} KB ({mime})", flush=True)

        parsed, raw, err = self.try_nim(b64, primary, key, mime)
        used_model = primary
        fallback_used = False
        if parsed is None and not no_fallback and fallback and fallback != primary:
            print(f"[OCR] {primary} a échoué ({err}) → fallback {fallback}", flush=True)
            parsed_fb, raw_fb, err_fb = self.try_nim(b64, fallback, key, mime)
            if parsed_fb is not None:
                parsed, raw, err = parsed_fb, raw_fb, None
                used_model = fallback
                fallback_used = True
            else:
                print(f"[OCR] fallback {fallback} aussi échoué : {err_fb}", flush=True)

        if parsed is None:
            print(f"[OCR] erreur finale : {err}", flush=True)
            return self.write_json({'error': err or 'Échec NIM', 'details': raw}, 502)

        print(f"[OCR] OK · model={used_model}{' (fallback)' if fallback_used else ''} · name='{parsed.get('name','?')}'", flush=True)
        return self.write_json({'ok': True, 'data': parsed, 'model': used_model, 'fallback_used': fallback_used, 'primary': primary})


class ThreadedServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True
    allow_reuse_address = True


def bootstrap_assets():
    """Télécharge les icônes manquantes au premier lancement (depuis dofusretrotools.com)."""
    base = 'https://dofusretrotools.com'
    headers = {'User-Agent': 'Mozilla/5.0', 'Referer': base + '/'}

    def needs(folder):
        path = os.path.join(ROOT, folder)
        if not os.path.isdir(path):
            return True
        try:
            return not any(f.endswith('.svg') for f in os.listdir(path))
        except OSError:
            return True

    tasks = []
    if needs('icons'):
        try:
            with open(os.path.join(ROOT, 'resources.json'), 'r', encoding='utf-8') as f:
                for it in json.load(f):
                    fname = (it.get('img') or '').split('/')[-1]
                    if fname:
                        tasks.append(('icons', f"{base}/images/ressources/{fname}", fname))
        except FileNotFoundError:
            pass

    if needs('item-icons'):
        try:
            with open(os.path.join(ROOT, 'items.json'), 'r', encoding='utf-8') as f:
                for it in json.load(f):
                    cat, pic = it.get('cat'), it.get('pic')
                    if cat and pic:
                        fname = f"{cat}-{pic}.svg"
                        tasks.append(('item-icons', f"{base}/uploads/items/{cat}/{pic}.svg", fname))
        except FileNotFoundError:
            pass

    if needs('mob-icons'):
        try:
            with open(os.path.join(ROOT, 'mobs.json'), 'r', encoding='utf-8') as f:
                seen = set()
                for it in json.load(f):
                    gfx = it.get('gfx')
                    if gfx and gfx not in seen:
                        seen.add(gfx)
                        tasks.append(('mob-icons', f"{base}/images/monstrequeteocre/{gfx}.svg", f"{gfx}.svg"))
        except FileNotFoundError:
            pass

    if not tasks:
        return

    for f in {t[0] for t in tasks}:
        os.makedirs(os.path.join(ROOT, f), exist_ok=True)

    print(f"[bootstrap] téléchargement de {len(tasks)} icônes au premier lancement (~30s)…", flush=True)

    def fetch(t):
        folder, url, fname = t
        out = os.path.join(ROOT, folder, fname)
        if os.path.exists(out) and os.path.getsize(out) > 0:
            return 'skip'
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=15) as r:
                data = r.read()
            with open(out, 'wb') as f:
                f.write(data)
            return 'ok'
        except Exception:
            return 'err'

    ok = err = 0
    with ThreadPoolExecutor(max_workers=24) as ex:
        futures = [ex.submit(fetch, t) for t in tasks]
        for i, fut in enumerate(as_completed(futures), 1):
            kind = fut.result()
            if kind == 'ok':
                ok += 1
            elif kind == 'err':
                err += 1
            if i % 250 == 0:
                print(f"[bootstrap] {i}/{len(tasks)}", flush=True)
    print(f"[bootstrap] OK · {ok} téléchargés{f' · {err} erreurs' if err else ''}", flush=True)


def main():
    no_open = '--no-open' in sys.argv
    os.chdir(ROOT)
    bootstrap_assets()
    addr = ('127.0.0.1', PORT)
    try:
        httpd = ThreadedServer(addr, Handler)
    except OSError as e:
        print(f"Impossible d'ouvrir le port {PORT} : {e}", file=sys.stderr)
        print("Astuce : MEMO_PRICE_PORT=9000 python serve.py")
        sys.exit(1)
    url = f'http://{addr[0]}:{PORT}/'
    print(f'Memo Price · Dofus Retro')
    print(f'  → {url}')
    print(f'  config: {CONFIG_PATH} ({"clé NIM OK" if load_config().get("nim_key") else "pas de clé NIM (OCR désactivé)"})')
    print('  Ctrl+C pour arrêter.')
    if not no_open:
        threading.Timer(0.4, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nbye.')
    finally:
        httpd.server_close()


if __name__ == '__main__':
    main()
