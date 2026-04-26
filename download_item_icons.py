"""Télécharge les icônes des items craftables vers ./item-icons/cat-pic.svg"""
import json, os
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ROOT = os.path.dirname(os.path.abspath(__file__))
DIR = os.path.join(ROOT, "item-icons")
JSON_PATH = os.path.join(ROOT, "items.json")
BASE = "https://dofusretrotools.com"
HEADERS = {"User-Agent": "Mozilla/5.0", "Referer": "https://dofusretrotools.com/"}

os.makedirs(DIR, exist_ok=True)
with open(JSON_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

def fetch(it):
    cat, pic = it.get("cat"), it.get("pic")
    if not cat or not pic:
        return ("skip", None)
    fname = f"{cat}-{pic}.svg"
    out = os.path.join(DIR, fname)
    if os.path.exists(out) and os.path.getsize(out) > 0:
        return ("skip", fname)
    url = f"{BASE}/uploads/items/{cat}/{pic}.svg"
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
    futs = [ex.submit(fetch, it) for it in data]
    for i, fut in enumerate(as_completed(futs), 1):
        kind, _ = fut.result()
        if kind == "ok": ok += 1
        elif kind == "skip": skip += 1
        else: err += 1
        if i % 200 == 0:
            print(f"{i}/{len(data)}  ok={ok} skip={skip} err={err}", flush=True)

print(f"DONE  ok={ok} skip={skip} err={err}")
