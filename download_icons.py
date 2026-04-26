"""Télécharge les icônes SVG des ressources depuis dofusretrotools.com vers ./icons/"""
import json, os, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ROOT = os.path.dirname(os.path.abspath(__file__))
ICONS_DIR = os.path.join(ROOT, "icons")
JSON_PATH = os.path.join(ROOT, "resources.json")
BASE = "https://dofusretrotools.com"
HEADERS = {"User-Agent": "Mozilla/5.0", "Referer": "https://dofusretrotools.com/"}

os.makedirs(ICONS_DIR, exist_ok=True)

with open(JSON_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

def fetch(it):
    img = it["img"]
    fname = os.path.basename(img)
    out = os.path.join(ICONS_DIR, fname)
    if os.path.exists(out) and os.path.getsize(out) > 0:
        return ("skip", fname)
    url = BASE + img
    req = Request(url, headers=HEADERS)
    try:
        with urlopen(req, timeout=15) as r:
            content = r.read()
        with open(out, "wb") as f:
            f.write(content)
        return ("ok", fname)
    except (HTTPError, URLError) as e:
        return ("err", f"{fname}: {e}")

ok = err = skip = 0
errors = []
with ThreadPoolExecutor(max_workers=16) as ex:
    futs = [ex.submit(fetch, it) for it in data]
    for i, fut in enumerate(as_completed(futs), 1):
        kind, info = fut.result()
        if kind == "ok": ok += 1
        elif kind == "skip": skip += 1
        else:
            err += 1
            errors.append(info)
        if i % 100 == 0:
            print(f"{i}/{len(data)}  ok={ok} skip={skip} err={err}", flush=True)

print(f"DONE  ok={ok} skip={skip} err={err}")
if errors:
    print("first errors:", errors[:5])
