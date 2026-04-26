"""Télécharge les icônes mobs depuis dofusretrotools.com vers ./mob-icons/{gfxId}.svg"""
import json, os
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ROOT = os.path.dirname(os.path.abspath(__file__))
DIR = os.path.join(ROOT, "mob-icons")
JSON_PATH = os.path.join(ROOT, "mobs.json")
BASE = "https://dofusretrotools.com"
HEADERS = {"User-Agent": "Mozilla/5.0", "Referer": "https://dofusretrotools.com/"}

os.makedirs(DIR, exist_ok=True)
with open(JSON_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)
gfx_ids = sorted(set(m["gfx"] for m in data if m.get("gfx")))

def fetch(gfx):
    fname = f"{gfx}.svg"
    out = os.path.join(DIR, fname)
    if os.path.exists(out) and os.path.getsize(out) > 0:
        return ("skip", fname)
    url = f"{BASE}/images/monstrequeteocre/{gfx}.svg"
    try:
        with urlopen(Request(url, headers=HEADERS), timeout=15) as r:
            content = r.read()
        with open(out, "wb") as f:
            f.write(content)
        return ("ok", fname)
    except (HTTPError, URLError) as e:
        return ("err", f"{fname}: {e}")

ok = err = skip = 0
with ThreadPoolExecutor(max_workers=24) as ex:
    futs = [ex.submit(fetch, g) for g in gfx_ids]
    for i, fut in enumerate(as_completed(futs), 1):
        kind, _ = fut.result()
        if kind == "ok": ok += 1
        elif kind == "skip": skip += 1
        else: err += 1
        if i % 200 == 0:
            print(f"{i}/{len(gfx_ids)}  ok={ok} skip={skip} err={err}", flush=True)

print(f"DONE  ok={ok} skip={skip} err={err}")
