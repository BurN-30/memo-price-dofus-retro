(() => {
  'use strict';

  const STORAGE_KEY = 'memo-price-state-v1';
  const STORAGE_KEY_NIM = 'penates.nim_key';
  const STORAGE_KEY_MODEL = 'penates.nim_model';
  const STORAGE_KEY_ONBOARDING = 'penates.onboarding_dismissed';
  const DEFAULT_MODEL = 'meta/llama-3.2-11b-vision-instruct';
  const iconUrl = it => 'icons/' + (it.img || '').split('/').pop();

  function getNimKey() { return localStorage.getItem(STORAGE_KEY_NIM) || ''; }
  function setNimKey(k) { if (k) localStorage.setItem(STORAGE_KEY_NIM, k); else localStorage.removeItem(STORAGE_KEY_NIM); }
  function getNimModel() { return localStorage.getItem(STORAGE_KEY_MODEL) || DEFAULT_MODEL; }
  function setNimModel(m) { localStorage.setItem(STORAGE_KEY_MODEL, m || DEFAULT_MODEL); }
  function hasNimKey() { return !!getNimKey(); }

  // --- catalog (resources + items)
  const CATALOG = window.RESOURCES || [];
  const BY_ID = new Map(CATALOG.map(it => [it.id, it]));
  const ITEMS = window.ITEMS || []; // tous les items (avec ou sans recette)
  const ITEMS_BY_ID = new Map(ITEMS.map(it => [it.id, it]));
  const ITEMS_BY_OFFICIAL = new Map(ITEMS.filter(it => it.o != null).map(it => [it.o, it]));
  const MOBS = window.MOBS || [];
  const RECIPES = ITEMS.filter(it => Array.isArray(it.ing) && it.ing.length > 0);
  const itemIconUrl = it => `item-icons/${it.cat}-${it.pic}.svg`;
  const itemIconUrlByPic = (cat, pic) => `item-icons/${cat}-${pic}.svg`;

  function computeCraftCost(itemId, qty = 1) {
    const item = ITEMS_BY_ID.get(itemId);
    if (!item || !Array.isArray(item.ing)) return { cost: 0, missing: 0, total: 0 };
    let cost = 0, missing = 0;
    for (const ing of item.ing) {
      const r = resolveIngredient(ing);
      const p = r.priceableId != null ? getPrice(r.priceableId) : null;
      if (p == null) missing++;
      else cost += p * (ing.n * qty);
    }
    return { cost, missing, total: item.ing.length };
  }

  function resolveIngredient(ing) {
    // priorité 1 : resource (par id)
    const res = BY_ID.get(ing.id);
    if (res) return {
      kind: 'resource', id: res.id,
      name: res.name, level: res.level, type: res.type, pods: res.pods,
      iconUrl: iconUrl(res),
      priceableId: res.id
    };
    // priorité 2 : item (par official id)
    const item = ITEMS_BY_OFFICIAL.get(ing.id);
    if (item) return {
      kind: 'item', id: item.id, officialId: item.o,
      name: item.name, level: item.level, type: 'Item', pods: item.pods,
      iconUrl: itemIconUrl(item),
      priceableId: 'i' + item.id  // préfixe pour distinguer dans state.prices
    };
    // fallback : on a juste le name + picture du JSON ingredient
    return {
      kind: 'unknown', id: 'u' + ing.id,
      name: ing.name || ('#' + ing.id), level: '?', type: 'introuvable',
      iconUrl: ing.pic ? itemIconUrlByPic('an', ing.pic) : null,
      priceableId: null
    };
  }

  // --- seed (les 14 items du fichier price retro.txt + dossiers de farm pré-organisés)
  const SEED_PRICES = {
    2556: 200,    // Pollen de Blop
    2252: 80,     // Dent en Or du Craqueleur
    2305: 210,    // Fragment de Pierre Pointue
    2304: 80,     // Fragment de Pierre Polie
    547:  580,    // Pierre de Rubis
    546:  160,    // Pierre de Saphir
    543:  830,    // Pierre de Diamant
    450:  160,    // Pierre de Granit
    431:  40,     // Pierre du Craqueleur
    1682: 780,    // Ecorce de Liroye Merline
    435:  40,     // Racine d'Abraknyde
    1610: 30,     // Ecorce d'Abraknyde Sombre
    1612: 10,     // Racine d'Abraknyde Sombre
    1611: 3900    // Bourgeon d'Abraknyde Sombre
  };
  const SEED_FOLDERS = [
    { id: 'craq',   icon: 'mob:1156', name: 'Farm Craq',     items: [2252, 2305, 2304, 547, 546, 543, 450, 431] },
    { id: 'blop',   icon: 'mob:1174', name: 'Farm Blop',     items: [2556] },
    { id: 'as',     icon: 'mob:1158', name: 'Farm AS',       items: [1610, 1612, 1611] },
    { id: 'aa',     icon: 'mob:1458', name: 'Farm AA',       items: [] },
    { id: 'forge',  icon: 'mob:1074', name: 'Farm Forgeron', items: [] }
  ];

  // --- aliases (abréviations Dofus Retro courantes)
  const ALIASES = [
    // composés explicites en premier (matchés en priorité car plus longs)
    ['eco. liroye',     'écorce de liroye merline'],
    ['eco liroye',      'écorce de liroye merline'],
    ['ecorce liroye',   'écorce de liroye merline'],
    ['liroye',          'liroye merline'],
    ['eco. abra s.',    'écorce d\'abraknyde sombre'],
    ['eco abra s',      'écorce d\'abraknyde sombre'],
    ['eco. abra a.',    'écorce d\'abraknyde ancestral'],
    ['eco abra a',      'écorce d\'abraknyde ancestral'],
    ['eco. abra',       'écorce d\'abraknyde'],
    ['eco abra',        'écorce d\'abraknyde'],
    ['rac. abra s.',    'racine d\'abraknyde sombre'],
    ['rac abra s',      'racine d\'abraknyde sombre'],
    ['rac. abra a.',    'racine d\'abraknyde ancestral'],
    ['rac abra a',      'racine d\'abraknyde ancestral'],
    ['rac. abra',       'racine d\'abraknyde'],
    ['rac abra',        'racine d\'abraknyde'],
    ['bourg abra. s.',  'bourgeon d\'abraknyde sombre'],
    ['bourg abra s',    'bourgeon d\'abraknyde sombre'],
    ['bourg abra. a.',  'bourgeon de l\'abraknyde ancestral'],
    ['bourg abra a',    'bourgeon de l\'abraknyde ancestral'],
    ['bourg abra',      'bourgeon d\'abraknyde'],
    ['dent or craq',    'dent en or du craqueleur'],
    ['dent or',         'dent en or du craqueleur'],
    ['pierre pointue',  'fragment de pierre pointue'],
    ['pierre polie',    'fragment de pierre polie'],
    ['fragment pierre pointue', 'fragment de pierre pointue'],
    ['fragment pierre polie',   'fragment de pierre polie'],
    ['pierre du craq',  'pierre du craqueleur'],
    ['pierre craq',     'pierre du craqueleur'],
    ['pierre rubis',    'pierre de rubis'],
    ['pierre saphir',   'pierre de saphir'],
    ['pierre emeraude', 'pierre d\'émeraude'],
    ['pierre topaze',   'pierre de topaze'],
    ['pierre diam',     'pierre de diamant'],
    ['pierre granit',   'pierre de granit'],
    ['pierre cristal',  'pierre de cristal'],
    ['pollen blop',     'pollen de blop'],
    // singletons / typos
    ['ebonite',         'ebonite'],
    ['kriptonite',      'kriptonite'],
    ['kryptonite',      'kriptonite'],
    // mots seuls (matching plus large)
    ['eco.',            'écorce'],
    ['rac.',            'racine'],
    ['bourg',           'bourgeon'],
    ['abra s.',         'abraknyde sombre'],
    ['abra a.',         'abraknyde ancestral'],
    ['abra',            'abraknyde'],
    ['craq',            'craqueleur'],
    ['diam',            'diamant'],
  ];

  // --- state
  let state = loadState();
  let currentFolderId = state.currentFolderId || 'all';
  let editingFolderId = null;

  function defaultState() {
    const now = Date.now();
    const prices = {};
    for (const [id, v] of Object.entries(SEED_PRICES)) prices[id] = { value: v, updatedAt: now };
    return {
      prices,
      folders: SEED_FOLDERS.map(f => ({ ...f, items: [...f.items] })),
      currentFolderId: 'all',
      hiddenHints: {},
      crafts: []
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const s = JSON.parse(raw);
      if (!s.prices || !s.folders) return defaultState();
      if (!s.hiddenHints) s.hiddenHints = {};
      if (!Array.isArray(s.crafts)) s.crafts = [];
      // migration: prices stored as plain numbers → objets {value, updatedAt}
      const now = Date.now();
      for (const [id, v] of Object.entries(s.prices)) {
        if (typeof v === 'number' || typeof v === 'string') {
          s.prices[id] = { value: Number(v) || 0, updatedAt: now };
        } else if (v && typeof v === 'object') {
          if (typeof v.value !== 'number') v.value = Number(v.value) || 0;
          if (!v.updatedAt) v.updatedAt = now;
        }
      }
      return s;
    } catch (e) {
      return defaultState();
    }
  }

  function saveState() {
    state.currentFolderId = currentFolderId;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function setPrice(id, value, when) {
    if (value == null || isNaN(value)) {
      delete state.prices[id];
      return;
    }
    state.prices[id] = { value: Number(value), updatedAt: when || Date.now() };
  }
  function getPrice(id) {
    const p = state.prices[id];
    return p ? p.value : null;
  }
  function getUpdatedAt(id) {
    const p = state.prices[id];
    return p ? p.updatedAt : null;
  }

  // --- formatting helpers
  function fmtKamas(v) {
    if (v == null || v === '' || isNaN(v)) return '';
    const n = Number(v);
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 2).replace(/\.?0+$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '') + 'K';
    return String(n);
  }
  function parseKamas(s) {
    if (s == null) return null;
    s = String(s).trim().toLowerCase().replace(/\s|,/g, '');
    if (!s) return null;
    let mult = 1;
    if (s.endsWith('m')) { mult = 1_000_000; s = s.slice(0, -1); }
    else if (s.endsWith('k')) { mult = 1_000; s = s.slice(0, -1); }
    const n = parseFloat(s);
    if (isNaN(n)) return null;
    return Math.round(n * mult);
  }
  function fmtRel(ts) {
    if (!ts) return '';
    const dt = (Date.now() - ts) / 1000;
    if (dt < 60) return '<1 min ago';
    if (dt < 3600) return Math.floor(dt / 60) + ' min ago';
    if (dt < 86400) return Math.floor(dt / 3600) + 'h ago';
    const d = Math.floor(dt / 86400);
    if (d < 30) return d + 'j ago';
    if (d < 365) return Math.floor(d / 30) + 'mo ago';
    return Math.floor(d / 365) + 'a ago';
  }
  function freshness(ts) {
    if (!ts) return '';
    const dt = (Date.now() - ts) / 86400000;
    if (dt < 1) return 'fresh';
    if (dt < 7) return 'stale';
    return 'old';
  }

  // --- folder helpers
  function getCurrentFolder() {
    if (currentFolderId === 'all') return null;
    return state.folders.find(f => f.id === currentFolderId);
  }

  function getCurrentItems() {
    if (currentFolderId === 'all') {
      return Object.keys(state.prices).map(Number).filter(id => BY_ID.has(id));
    }
    const f = getCurrentFolder();
    return f ? f.items.filter(id => BY_ID.has(id)) : [];
  }

  // --- normalize & matching
  function normalize(s) {
    return String(s).toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/['']/g, '\'')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function applyAliases(s) {
    let n = ' ' + s + ' ';
    for (const [k, v] of ALIASES) {
      const kn = normalize(k);
      const re = new RegExp('(^|\\s|\\b)' + kn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|\\s|\\b)', 'gi');
      n = n.replace(re, (m, a, b) => (a || ' ') + normalize(v) + (b || ' '));
    }
    return n.replace(/\s+/g, ' ').trim();
  }
  // trigram similarity (Dice coefficient)
  function trigrams(s) {
    s = '  ' + s + '  ';
    const t = new Set();
    for (let i = 0; i < s.length - 2; i++) t.add(s.slice(i, i + 3));
    return t;
  }
  function similarity(a, b) {
    const A = trigrams(a), B = trigrams(b);
    if (A.size === 0 || B.size === 0) return 0;
    let inter = 0;
    for (const x of A) if (B.has(x)) inter++;
    return 2 * inter / (A.size + B.size);
  }

  function findMatches(query, max = 5) {
    const qNorm = normalize(query);
    const q = applyAliases(qNorm);
    const scored = [];
    for (const it of CATALOG) {
      const n = normalize(it.name);
      let s = similarity(q, n);
      // bonus: query is contained in name
      if (n.includes(q)) s += 0.20;
      if (n === q) s += 0.50;
      // bonus: each query word found in name
      const qWords = q.split(' ').filter(w => w.length > 1);
      const matched = qWords.filter(w => n.includes(w)).length;
      if (qWords.length) s += (matched / qWords.length) * 0.15;
      scored.push({ item: it, score: s });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, max);
  }

  // --- UI: render folders
  function renderFolders() {
    const $f = document.getElementById('folders');
    const allCount = Object.keys(state.prices).length;
    let html = '';
    html += folderRow('all', '◇', 'Tous mes prix', allCount, true);
    html += folderRow('crafts', '⚒', 'Crafts suivis', state.crafts.length, true);
    for (const f of state.folders) {
      html += folderRow(f.id, f.icon, f.name, f.items.length, false);
    }
    $f.innerHTML = html;
    for (const el of $f.querySelectorAll('.folder')) {
      el.addEventListener('click', () => {
        currentFolderId = el.dataset.id;
        saveState();
        render();
      });
    }
  }
  function folderIconHtml(icon) {
    if (!icon) return '·';
    const s = String(icon);
    if (s.startsWith('res:')) return `<img src="icons/${escapeHtml(s.slice(4))}.svg" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'·'}))">`;
    if (s.startsWith('mob:')) return `<img src="mob-icons/${escapeHtml(s.slice(4))}.svg" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'·'}))">`;
    return escapeHtml(s);
  }

  function folderRow(id, icon, name, count, special) {
    const active = id === currentFolderId ? ' active' : '';
    const sp = special ? ' special' : '';
    return `<div class="folder${active}${sp}" data-id="${id}" title="${escapeHtml(name)} · ${count} item${count>1?'s':''}">
      <span class="ic">${folderIconHtml(icon)}</span>
      <span class="name">${escapeHtml(name)}</span>
      <span class="count">${count}</span>
    </div>`;
  }

  // Icônes SVG pour les folders spéciaux (all, crafts)
  const ICON_DIAMOND_SVG = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1.5 L16.5 9 L9 16.5 L1.5 9 Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="9" cy="9" r="1.4" fill="currentColor"/></svg>';
  const ICON_ANVIL_SVG = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 7 L13 7 Q15 7 15 9 L15 11 L17 11 L17 13 L13 13 L13 11 Q13 9 11 9 L5 9 L5 14 L3 14 Z M5 14 L13 14 L14 16 L4 16 Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" fill="none"/></svg>';

  function renderHeader() {
    const f = getCurrentFolder();
    let iconHtml = ICON_DIAMOND_SVG, name = 'Tous mes prix';
    if (currentFolderId === 'crafts') { iconHtml = ICON_ANVIL_SVG; name = 'Crafts suivis'; }
    else if (f) { iconHtml = folderIconHtml(f.icon); name = f.name; }
    document.getElementById('folder-icon').innerHTML = iconHtml;
    document.getElementById('folder-name').textContent = name;
    document.getElementById('btn-rename').hidden = !f || currentFolderId === 'crafts';
    document.getElementById('btn-delete-folder').hidden = !f || currentFolderId === 'crafts';
  }

  function renderStats(items) {
    const total = items.reduce((sum, id) => sum + (Number(getPrice(id)) || 0), 0);
    document.getElementById('stat-count').textContent = items.length;
    document.getElementById('stat-total').textContent = fmtKamas(total) || '0';
  }

  function renderGrid() {
    const $grid = document.getElementById('grid');
    $grid.classList.remove('crafts-grid');
    if (currentFolderId === 'crafts') return renderCraftsView();
    const $empty = document.getElementById('empty');
    const search = document.getElementById('search').value.trim().toLowerCase();
    const sort = document.getElementById('sort').value;

    let ids = getCurrentItems();
    if (search) {
      ids = ids.filter(id => {
        const it = BY_ID.get(id);
        return it && (it.name.toLowerCase().includes(search) || (it.type || '').toLowerCase().includes(search));
      });
    }

    ids.sort((a, b) => {
      const A = BY_ID.get(a), B = BY_ID.get(b);
      if (!A || !B) return 0;
      switch (sort) {
        case 'name-desc': return B.name.localeCompare(A.name, 'fr');
        case 'price': return (getPrice(a) || 0) - (getPrice(b) || 0);
        case 'price-desc': return (getPrice(b) || 0) - (getPrice(a) || 0);
        case 'level': return (A.level || 0) - (B.level || 0);
        case 'level-desc': return (B.level || 0) - (A.level || 0);
        case 'type': return (A.type || '').localeCompare(B.type || '', 'fr') || A.name.localeCompare(B.name, 'fr');
        case 'updated-desc': return (getUpdatedAt(b) || 0) - (getUpdatedAt(a) || 0);
        default: return A.name.localeCompare(B.name, 'fr');
      }
    });

    renderStats(ids);

    if (!ids.length) {
      $grid.innerHTML = '';
      $empty.hidden = false;
      return;
    }
    $empty.hidden = true;

    $grid.innerHTML = ids.map(id => {
      const it = BY_ID.get(id);
      const price = getPrice(id);
      const priceStr = price != null ? fmtKamas(price) : '';
      const ts = getUpdatedAt(id);
      const rel = ts ? fmtRel(ts) : '';
      const cls = ts ? freshness(ts) : '';
      const updHtml = ts ? `<span class="upd ${cls}" title="${escapeHtml(new Date(ts).toLocaleString('fr-FR'))}">· ${rel}</span>` : '';
      return `<div class="row" data-id="${id}">
        <div class="img" data-tip="${id}">
          <img src="${iconUrl(it)}" alt="${escapeHtml(it.name)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'ph',textContent:'?'}))">
        </div>
        <div class="info" data-tip="${id}">
          <div class="nm">${escapeHtml(it.name)}</div>
          <div class="meta">${escapeHtml(it.type || '')} ${updHtml}</div>
        </div>
        <div class="level">niv <span class="v">${it.level || '?'}</span></div>
        <div class="price-wrap">
          <input class="price ${priceStr ? '' : 'empty'}" data-id="${id}" value="${priceStr}" placeholder="—" inputmode="text">
          <span class="unit">/u</span>
        </div>
        <div class="pods">${it.pods || ''} pods</div>
        <button class="del" data-del="${id}" title="Retirer">×</button>
      </div>`;
    }).join('');

    bindRows();
  }

  function renderCraftsView() {
    const $grid = document.getElementById('grid');
    const $empty = document.getElementById('empty');
    const search = document.getElementById('search').value.trim().toLowerCase();
    const sort = document.getElementById('sort').value;

    let crafts = state.crafts.slice();
    if (search) {
      crafts = crafts.filter(c => {
        const it = ITEMS_BY_ID.get(c.itemId);
        return it && it.name.toLowerCase().includes(search);
      });
    }

    const enriched = crafts.map(c => {
      const it = ITEMS_BY_ID.get(c.itemId);
      const cc = it ? computeCraftCost(c.itemId, c.qty || 1) : { cost: 0, missing: 0, total: 0 };
      const hdv = c.hdvPrice;
      const margin = hdv != null ? hdv - cc.cost : null;
      return { c, it, cc, hdv, margin };
    }).filter(x => x.it);

    enriched.sort((a, b) => {
      switch (sort) {
        case 'name-desc': return b.it.name.localeCompare(a.it.name, 'fr');
        case 'price': return (a.cc.cost) - (b.cc.cost);
        case 'price-desc': return (b.cc.cost) - (a.cc.cost);
        case 'level': return (a.it.level || 0) - (b.it.level || 0);
        case 'level-desc': return (b.it.level || 0) - (a.it.level || 0);
        case 'updated-desc': return (b.c.savedAt || 0) - (a.c.savedAt || 0);
        default: return a.it.name.localeCompare(b.it.name, 'fr');
      }
    });

    // stats
    const totalCost = enriched.reduce((s, x) => s + x.cc.cost, 0);
    const totalHdv = enriched.reduce((s, x) => s + (x.hdv || 0), 0);
    const totalMargin = enriched.reduce((s, x) => s + (x.margin || 0), 0);
    const marginCls = totalMargin > 0 ? 'pos' : totalMargin < 0 ? 'neg' : '';
    document.getElementById('stat-count').textContent = enriched.length;
    document.getElementById('stat-total').innerHTML = `${fmtKamas(totalCost) || '0'} <span class="stat-arrow">→</span> ${fmtKamas(totalHdv) || '0'} <span class="stat-margin ${marginCls}">(${totalMargin >= 0 ? '+' : ''}${fmtKamas(totalMargin) || '0'})</span>`;

    if (!enriched.length) {
      $grid.innerHTML = '';
      $empty.hidden = false;
      $empty.innerHTML = state.crafts.length === 0
        ? 'Aucun craft suivi pour le moment. Ouvrir <b>craft</b> dans la barre d\'outils, chercher un item, puis le sauvegarder pour qu\'il apparaisse ici.'
        : 'Aucun résultat.';
      return;
    }
    $empty.hidden = true;

    $grid.classList.add('crafts-grid');
    $grid.innerHTML = `<div class="crafts-head">
      <span class="ch-name">ITEM</span>
      <span class="ch-qty">QTÉ</span>
      <span class="ch-cost">COÛT INGRÉDIENTS</span>
      <span class="ch-hdv">PRIX HDV</span>
      <span class="ch-margin">MARGE</span>
      <span class="ch-act"></span>
    </div>` + enriched.map(({ c, it, cc, hdv, margin }) => {
      const approx = cc.missing > 0;
      const costStr = (approx ? '~' : '') + (fmtKamas(cc.cost) || '0');
      const hdvStr = hdv != null ? fmtKamas(hdv) : '';
      const marginCls = margin == null ? '' : margin > 0 ? 'pos' : margin < 0 ? 'neg' : '';
      const marginStr = margin == null
        ? '—'
        : (approx ? '~' : '') + (margin >= 0 ? '+' : '') + fmtKamas(margin);
      return `<div class="craft-row" data-craft-item="${c.itemId}">
        <div class="img" data-tip-item="${c.itemId}">
          <img src="${itemIconUrl(it)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'ph',textContent:'?'}))">
        </div>
        <div class="info" data-tip-item="${c.itemId}">
          <div class="nm">${escapeHtml(it.name)}</div>
          <div class="meta">niv ${it.level || '?'}${approx ? ` · <span style="color:var(--accent-3)">${cc.missing} prix manquant${cc.missing>1?'s':''} sur ${cc.total}</span>` : ` · ${cc.total} ingrédients`}</div>
        </div>
        <div class="qty">
          <button data-craft-qty-minus="${c.itemId}">−</button>
          <span class="v">${c.qty || 1}</span>
          <button data-craft-qty-plus="${c.itemId}">+</button>
        </div>
        <div class="cost ${approx ? 'approx' : ''}" title="${approx ? 'Estimation incomplète : ' + cc.missing + ' prix manquant(s)' : 'Coût exact'}">${costStr}</div>
        <div class="hdv-cell">
          <input class="hdv-input" data-craft-hdv="${c.itemId}" value="${hdvStr}" placeholder="—">
          <span class="unit">/u</span>
        </div>
        <div class="margin ${marginCls}">${marginStr}</div>
        <div class="act">
          <button data-craft-open="${c.itemId}" title="Voir / éditer la recette" aria-label="Éditer">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 2 L12 4.5 L4.5 12 L1.5 12.5 L2 9.5 Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round" fill="none"/></svg>
          </button>
          <button data-craft-remove="${c.itemId}" title="Retirer du suivi" aria-label="Retirer">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>`;
    }).join('');

    bindCraftRows();
  }

  function bindCraftRows() {
    const $grid = document.getElementById('grid');
    for (const inp of $grid.querySelectorAll('.hdv-input')) {
      inp.addEventListener('focus', () => inp.select());
      inp.addEventListener('blur', () => {
        const id = +inp.dataset.craftHdv;
        const v = parseKamas(inp.value);
        const c = state.crafts.find(x => x.itemId === id);
        if (!c) return;
        c.hdvPrice = v;
        c.hdvUpdatedAt = Date.now();
        saveState();
        renderCraftsView();
      });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.blur(); });
    }
    for (const btn of $grid.querySelectorAll('[data-craft-qty-plus]')) {
      btn.addEventListener('click', () => updateCraftQty(+btn.dataset.craftQtyPlus, +1));
    }
    for (const btn of $grid.querySelectorAll('[data-craft-qty-minus]')) {
      btn.addEventListener('click', () => updateCraftQty(+btn.dataset.craftQtyMinus, -1));
    }
    for (const btn of $grid.querySelectorAll('[data-craft-remove]')) {
      btn.addEventListener('click', () => {
        const id = +btn.dataset.craftRemove;
        const it = ITEMS_BY_ID.get(id);
        if (!confirm(`Retirer "${it?.name || '#' + id}" du suivi ?`)) return;
        state.crafts = state.crafts.filter(x => x.itemId !== id);
        saveState();
        render();
      });
    }
    for (const btn of $grid.querySelectorAll('[data-craft-open]')) {
      btn.addEventListener('click', () => {
        loadRecipe(+btn.dataset.craftOpen);
        $recipeModal.hidden = false;
      });
    }
  }

  function updateCraftQty(itemId, delta) {
    const c = state.crafts.find(x => x.itemId === itemId);
    if (!c) return;
    const nq = Math.max(1, Math.min(999, (c.qty || 1) + delta));
    c.qty = nq;
    saveState();
    renderCraftsView();
  }

  function saveCraftFromRecipe(itemId, qty, hdvPrice) {
    let c = state.crafts.find(x => x.itemId === itemId);
    if (c) {
      c.qty = qty;
      if (hdvPrice != null) { c.hdvPrice = hdvPrice; c.hdvUpdatedAt = Date.now(); }
    } else {
      state.crafts.push({ itemId, qty, hdvPrice: hdvPrice ?? null, hdvUpdatedAt: hdvPrice != null ? Date.now() : null, savedAt: Date.now() });
    }
    saveState();
  }

  function bindRows() {
    for (const inp of document.querySelectorAll('.price')) {
      inp.addEventListener('focus', () => inp.select());
      inp.addEventListener('blur', () => commitPrice(inp));
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') { inp.blur(); }
        if (e.key === 'Escape') {
          const id = +inp.dataset.id;
          const v = getPrice(id);
          inp.value = v != null ? fmtKamas(v) : '';
          inp.blur();
        }
      });
    }
    for (const btn of document.querySelectorAll('[data-del]')) {
      btn.addEventListener('click', () => removeItemFromCurrent(+btn.dataset.del));
    }
    bindTooltips();
  }

  function commitPrice(inp) {
    const id = +inp.dataset.id;
    const v = parseKamas(inp.value);
    setPrice(id, v);
    saveState();
    render();
  }

  function removeItemFromCurrent(id) {
    if (currentFolderId === 'all') {
      delete state.prices[id];
    } else {
      const f = getCurrentFolder();
      if (f) f.items = f.items.filter(x => x !== id);
    }
    saveState();
    render();
  }

  // --- tooltip
  const $tip = document.getElementById('tip');
  function bindTooltips() {
    for (const el of document.querySelectorAll('[data-tip]')) {
      el.addEventListener('mouseenter', e => showTip(+el.dataset.tip, e));
      el.addEventListener('mousemove', moveTip);
      el.addEventListener('mouseleave', hideTip);
    }
  }
  function showTip(id, e) {
    const it = BY_ID.get(id);
    if (!it) return;
    const ts = getUpdatedAt(id);
    $tip.innerHTML = `
      <div class="t-name">${escapeHtml(it.name)}</div>
      <div class="t-row"><span class="k">Type</span><span class="v t-type">${escapeHtml(it.type || '—')}</span></div>
      <div class="t-row"><span class="k">Niveau</span><span class="v t-level">${it.level || '—'}</span></div>
      <div class="t-row"><span class="k">Pods</span><span class="v">${it.pods || '—'}</span></div>
      ${ts ? `<div class="t-row"><span class="k">Maj</span><span class="v">${escapeHtml(new Date(ts).toLocaleString('fr-FR'))}</span></div>` : ''}
      <div class="t-row"><span class="k">ID</span><span class="v">${it.id}</span></div>
    `;
    $tip.hidden = false;
    moveTip(e);
  }
  function moveTip(e) {
    if ($tip.hidden) return;
    const pad = 14;
    const w = $tip.offsetWidth, h = $tip.offsetHeight;
    let x = e.clientX + pad, y = e.clientY + pad;
    if (x + w > window.innerWidth - 10) x = e.clientX - w - pad;
    if (y + h > window.innerHeight - 10) y = e.clientY - h - pad;
    $tip.style.left = x + 'px';
    $tip.style.top = y + 'px';
  }
  function hideTip() { $tip.hidden = true; }

  // --- pick modal (existing)
  const $pickModal = document.getElementById('modal-pick');
  const $pickSearch = document.getElementById('pick-search');
  const $pickResults = document.getElementById('pick-results');

  function openPick() {
    $pickSearch.value = '';
    $pickModal.hidden = false;
    $pickSearch.focus();
    renderPickResults('');
  }
  function closePick() { $pickModal.hidden = true; }

  function renderPickResults(q) {
    q = q.trim().toLowerCase();
    const inFolder = new Set(currentFolderId === 'all'
      ? Object.keys(state.prices).map(Number)
      : (getCurrentFolder()?.items || []));
    let pool = CATALOG;
    if (q) {
      pool = CATALOG.filter(it =>
        it.name.toLowerCase().includes(q) ||
        (it.type || '').toLowerCase().includes(q));
    }
    const slice = pool.slice(0, 80);
    $pickResults.innerHTML = slice.map(it => {
      const added = inFolder.has(it.id);
      return `<div class="pick-row ${added ? 'added' : ''}" data-pick="${it.id}">
        <div class="img"><img src="${iconUrl(it)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'ph',textContent:'?'}))"></div>
        <div>
          <div class="nm">${escapeHtml(it.name)}</div>
          <div class="meta">${escapeHtml(it.type || '')}</div>
        </div>
        <div class="lvl">niv ${it.level || '?'}</div>
        <div>${added ? '<span class="add-tag">déjà</span>' : ''}</div>
      </div>`;
    }).join('') + (pool.length > slice.length ? `<div class="pick-row" style="cursor:default;color:var(--text-mute);justify-content:center"><span></span><span style="grid-column:2/-1">+ ${pool.length - slice.length} autres résultats, affiner la recherche</span></div>` : '');
    for (const row of $pickResults.querySelectorAll('[data-pick]')) {
      row.addEventListener('click', () => addItemToCurrent(+row.dataset.pick));
    }
  }

  function addItemToCurrent(id) {
    if (currentFolderId === 'all') {
      if (!state.prices[id]) state.prices[id] = { value: 0, updatedAt: Date.now() };
    } else {
      const f = getCurrentFolder();
      if (!f) return;
      if (!f.items.includes(id)) f.items.push(id);
      if (!state.prices[id]) state.prices[id] = { value: 0, updatedAt: Date.now() };
    }
    saveState();
    render();
    renderPickResults($pickSearch.value);
  }

  // --- folder modal (avec icon picker tabs)
  const $fModal = document.getElementById('modal-folder');
  const $fName = document.getElementById('folder-name-input');
  const $fIcon = document.getElementById('folder-icon-input');
  const $fTitle = document.getElementById('folder-modal-title');
  const $fPreview = document.getElementById('folder-icon-preview');
  let selectedFolderIcon = '';

  function setFolderIcon(icon) {
    selectedFolderIcon = icon || '';
    $fPreview.innerHTML = folderIconHtml(selectedFolderIcon);
  }

  function switchIconTab(name) {
    for (const btn of document.querySelectorAll('[data-icon-tab]')) {
      btn.classList.toggle('active', btn.dataset.iconTab === name);
    }
    for (const pane of document.querySelectorAll('[data-icon-pane]')) {
      pane.hidden = pane.dataset.iconPane !== name;
    }
    if (name === 'res') renderIconGrid('res');
    if (name === 'mob') renderIconGrid('mob');
  }

  function renderIconGrid(type) {
    const $grid = document.getElementById('icon-grid-' + type);
    const $search = document.getElementById('icon-search-' + type);
    const q = ($search.value || '').trim().toLowerCase();
    const qN = q ? normalize(q) : '';
    let pool;
    if (type === 'res') pool = CATALOG;
    else pool = MOBS;
    let filtered;
    if (qN) {
      filtered = pool.filter(it => normalize(it.name).includes(qN)).slice(0, 200);
    } else {
      filtered = pool.slice(0, 120);
    }
    if (!filtered.length) {
      $grid.innerHTML = `<div class="icon-grid-empty">Aucun résultat</div>`;
      return;
    }
    $grid.innerHTML = filtered.map(it => {
      let url, ref;
      if (type === 'res') {
        const fname = (it.img || '').split('/').pop().replace('.svg', '');
        url = 'icons/' + fname + '.svg';
        ref = 'res:' + fname;
      } else {
        url = 'mob-icons/' + it.gfx + '.svg';
        ref = 'mob:' + it.gfx;
      }
      const sel = ref === selectedFolderIcon ? ' selected' : '';
      return `<div class="icon-cell${sel}" data-pick-icon="${escapeHtml(ref)}" title="${escapeHtml(it.name)}">
        <img src="${url}" alt="" loading="lazy" onerror="this.style.opacity='.3'">
      </div>`;
    }).join('');
    for (const cell of $grid.querySelectorAll('[data-pick-icon]')) {
      cell.addEventListener('click', () => {
        setFolderIcon(cell.dataset.pickIcon);
        $grid.querySelectorAll('.icon-cell').forEach(c => c.classList.remove('selected'));
        cell.classList.add('selected');
      });
    }
  }

  function openFolderModal(editId) {
    editingFolderId = editId || null;
    let icon = '', name = '';
    if (editId && editId !== 'all') {
      const f = state.folders.find(x => x.id === editId);
      $fTitle.textContent = 'Renommer le dossier';
      icon = f.icon;
      name = f.name;
    } else {
      editingFolderId = null;
      $fTitle.textContent = 'Nouveau dossier';
      icon = '';
      name = '';
    }
    $fName.value = name;
    setFolderIcon(icon);
    // détermine quel onglet afficher
    let tab = 'emoji';
    if (icon.startsWith('res:')) tab = 'res';
    else if (icon.startsWith('mob:')) tab = 'mob';
    switchIconTab(tab);
    $fIcon.value = (icon && !icon.includes(':')) ? icon : '';
    document.getElementById('icon-search-res').value = '';
    document.getElementById('icon-search-mob').value = '';
    $fModal.hidden = false;
    $fName.focus();
  }
  function closeFolderModal() { $fModal.hidden = true; }

  function saveFolder() {
    const name = ($fName.value || '').trim();
    const icon = selectedFolderIcon || '·';
    if (!name) { $fName.focus(); return; }
    if (editingFolderId) {
      const f = state.folders.find(x => x.id === editingFolderId);
      f.name = name;
      f.icon = icon;
    } else {
      const id = 'f' + Date.now().toString(36);
      state.folders.push({ id, icon, name, items: [] });
      currentFolderId = id;
    }
    saveState();
    closeFolderModal();
    render();
  }

  function deleteCurrentFolder() {
    const f = getCurrentFolder();
    if (!f) return;
    if (!confirm(`Supprimer le dossier "${f.name}" ? (les prix des items restent dans "Tous mes prix")`)) return;
    state.folders = state.folders.filter(x => x.id !== f.id);
    currentFolderId = 'all';
    saveState();
    render();
  }

  // --- bulk modal
  const $bulkModal = document.getElementById('modal-bulk');
  const $bulkInput = document.getElementById('bulk-input');
  const $bulkPreview = document.getElementById('bulk-preview');
  const $bulkTarget = document.getElementById('bulk-target');
  let bulkRows = []; // [{raw, name, priceStr, parsed:{value}, candidates:[], picked:itemId, skip:bool}]

  function openBulk() {
    $bulkInput.value = '';
    $bulkPreview.hidden = true;
    $bulkPreview.innerHTML = '';
    bulkRows = [];
    const f = getCurrentFolder();
    $bulkTarget.innerHTML = f
      ? `Cible : <b>${escapeHtml(f.name)}</b> + prix global`
      : `Cible : <b>Tous mes prix</b> (prix global)`;
    $bulkModal.hidden = false;
    setTimeout(() => $bulkInput.focus(), 50);
  }
  function closeBulk() { $bulkModal.hidden = true; }

  function parseBulkLine(line) {
    if (!line || !line.trim()) return null;
    const cleaned = line.trim();
    // Sépare nom / partie chiffrée à la 1ère séquence "espace + chiffre"
    const idx = cleaned.search(/\s+\d/);
    if (idx < 0) return { raw: cleaned, name: cleaned, priceStr: null, value: null, tokens: [] };
    const name = cleaned.slice(0, idx).trim();
    const rest = cleaned.slice(idx).trim();

    // Extrait tous les tokens prix : <num>[k/m]? avec optionnel /<u|nombre>
    const tokens = [];
    const re = /(\d[\d\s.,]*\s*[kKmM]?)\s*(?:\/\s*(u|\d+))?/gi;
    let m;
    while ((m = re.exec(rest)) !== null) {
      if (!m[1].trim()) continue;
      const v = parseKamas(m[1]);
      if (v == null) continue;
      const unit = (m[2] || 'u').toLowerCase();
      const denom = unit === 'u' ? 1 : parseInt(unit) || 1;
      const perU = Math.round(v / denom);
      tokens.push({
        raw: m[0].trim(),
        value: v,
        unit,
        denom,
        perU
      });
    }
    if (!tokens.length) return { raw: cleaned, name: cleaned, priceStr: null, value: null, tokens: [] };

    // priorité : /u, sinon le plus petit denom
    tokens.sort((a, b) => a.denom - b.denom);
    const primary = tokens.find(t => t.unit === 'u') || tokens[0];
    return { raw: cleaned, name, priceStr: primary.raw, value: primary.perU, tokens };
  }

  function analyzeBulk() {
    const lines = $bulkInput.value.split(/\r?\n/);
    bulkRows = [];
    for (const ln of lines) {
      const parsed = parseBulkLine(ln);
      if (!parsed) continue;
      const cands = findMatches(parsed.name, 6);
      const top = cands[0];
      const conf = top ? top.score : 0;
      bulkRows.push({
        raw: parsed.raw,
        nameQuery: parsed.name,
        priceStr: parsed.priceStr,
        value: parsed.value,
        tokens: parsed.tokens || [],
        candidates: cands,
        pickedId: top && conf > 0.30 ? top.item.id : null,
        skip: false
      });
    }
    renderBulkPreview();
  }

  function renderBulkPreview() {
    if (!bulkRows.length) {
      $bulkPreview.hidden = true;
      $bulkPreview.innerHTML = '';
      return;
    }
    $bulkPreview.hidden = false;
    let okCount = 0;
    const rowsHtml = bulkRows.map((r, idx) => {
      const top = r.candidates[0];
      const score = top ? top.score : 0;
      const it = r.pickedId ? BY_ID.get(r.pickedId) : (top && top.item);
      let confClass = 'bad', confTxt = 'Aucun match';
      if (it && score >= 0.55) { confClass = 'ok'; confTxt = 'Sûr'; }
      else if (it && score >= 0.30) { confClass = 'maybe'; confTxt = 'À vérifier'; }
      else if (it) { confClass = 'maybe'; confTxt = '?'; }
      const valid = !!it && !r.skip && r.value != null;
      if (valid) okCount++;
      const optsHtml = r.candidates.map(c => {
        const sel = c.item.id === r.pickedId ? ' selected' : '';
        return `<option value="${c.item.id}"${sel}>${escapeHtml(c.item.name)} · niv ${c.item.level || '?'} (${(c.score*100).toFixed(0)}%)</option>`;
      }).join('') + `<option value="">— retirer —</option>`;
      const imgHtml = it
        ? `<img src="${iconUrl(it)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'ph',textContent:'?'}))">`
        : `<span class="ph">?</span>`;
      return `<div class="bulk-row${r.skip ? ' skipped' : ''}" data-idx="${idx}">
        <div class="img">${imgHtml}</div>
        <div>
          <div class="nm">${it ? escapeHtml(it.name) : '<i style="color:var(--text-mute)">aucun match</i>'}</div>
          <div class="meta">${it ? escapeHtml(it.type || '') + ' · niv ' + (it.level || '?') : escapeHtml(r.nameQuery)}</div>
        </div>
        <div class="raw" title="${escapeHtml(r.raw)}">${escapeHtml(r.raw)}</div>
        <div class="conf ${confClass}">${confTxt}</div>
        <select class="fix" data-fix="${idx}">${optsHtml}</select>
        <div class="price-out" title="${r.tokens && r.tokens.length > 1 ? r.tokens.map(t => `${t.raw} → ${t.perU}/u`).join('\n') : ''}">${r.value != null ? fmtKamas(r.value) : '—'}${r.tokens && r.tokens.length > 1 ? `<span style="font-size:9px;color:var(--text-mute);display:block">+${r.tokens.length-1} alt.</span>` : ''}</div>
        <button class="skip" data-skip="${idx}" title="Ignorer cette ligne">×</button>
      </div>`;
    }).join('');

    $bulkPreview.innerHTML = `<div style="padding:10px 12px;font-size:12px;color:var(--text-mute);border-bottom:1px solid var(--line-soft)">
      ${bulkRows.length} ligne(s) · ${okCount} prête(s) à appliquer
    </div>` + rowsHtml + `<div class="bulk-summary">
      <span class="info"><b>${okCount}</b> prix à appliquer</span>
      <div class="spacer"></div>
      <button id="bulk-cancel" class="btn-mini">Effacer</button>
      <button id="bulk-apply" class="btn-primary" ${okCount ? '' : 'disabled'}>Appliquer →</button>
    </div>`;

    for (const sel of $bulkPreview.querySelectorAll('select.fix')) {
      sel.addEventListener('change', e => {
        const idx = +e.target.dataset.fix;
        const v = e.target.value;
        bulkRows[idx].pickedId = v ? +v : null;
        renderBulkPreview();
      });
    }
    for (const b of $bulkPreview.querySelectorAll('button.skip')) {
      b.addEventListener('click', e => {
        const idx = +e.target.dataset.skip;
        bulkRows[idx].skip = !bulkRows[idx].skip;
        renderBulkPreview();
      });
    }
    const $cancel = document.getElementById('bulk-cancel');
    if ($cancel) $cancel.addEventListener('click', () => { bulkRows = []; renderBulkPreview(); });
    const $apply = document.getElementById('bulk-apply');
    if ($apply) $apply.addEventListener('click', applyBulk);
  }

  function applyBulk() {
    const f = getCurrentFolder();
    const now = Date.now();
    let n = 0;
    for (const r of bulkRows) {
      if (r.skip || !r.pickedId || r.value == null) continue;
      setPrice(r.pickedId, r.value, now);
      if (f && !f.items.includes(r.pickedId)) f.items.push(r.pickedId);
      n++;
    }
    saveState();
    closeBulk();
    render();
    flashStatus(`${n} prix appliqué${n > 1 ? 's' : ''}`);
  }

  // --- OCR modal (queue mode)
  const $ocrModal = document.getElementById('modal-ocr');
  const $ocrDrop = document.getElementById('ocr-drop');
  const $ocrFile = document.getElementById('ocr-file');
  const $ocrAnalyze = document.getElementById('ocr-analyze');
  const $ocrClearAll = document.getElementById('ocr-clear-all');
  const $ocrStatus = document.getElementById('ocr-status');
  const $ocrQueue = document.getElementById('ocr-queue');
  const $ocrMini = document.getElementById('ocr-mini');
  const $ocrMiniStatus = document.getElementById('ocr-mini-status');
  const $ocrMiniBar = document.getElementById('ocr-mini-bar');
  const $toast = document.getElementById('toast');
  let ocrQueue = []; // [{id, file, thumb, image, status, result, error, expanded, selectedItemId, selectedPrice}]
  let ocrCounter = 0;
  let ocrProcessing = false;
  let ocrMinimized = false;
  let toastTimer = null;

  function openOcr() {
    if (!hasNimKey()) {
      alert('OCR indisponible. Ouvre Réglages et entre ta clé NVIDIA NIM.');
      openSettings();
      return;
    }
    // Si une session existe déjà (minimisée), on ré-ouvre sans reset
    if (ocrMinimized || ocrQueue.length) {
      ocrMinimized = false;
      $ocrMini.hidden = true;
      $ocrModal.hidden = false;
      refreshOcrUI();
      return;
    }
    ocrQueue = [];
    ocrProcessing = false;
    ocrMinimized = false;
    $ocrMini.hidden = true;
    $ocrModal.hidden = false;
    refreshOcrUI();
  }
  function closeOcr() {
    // Si on ferme via × et qu'il y a des résultats non-appliqués, demander confirmation
    const unapplied = ocrQueue.filter(q => q.status === 'ready' || q.status === 'pending' || q.status === 'analyzing' || q.status === 'compressing');
    if (unapplied.length && !confirm(`Fermer la session OCR ?\n${unapplied.length} image(s) en cours/prêtes seront perdues.\n\nAstuce : utilise le bouton "−" pour réduire et garder la session.`)) {
      return;
    }
    $ocrModal.hidden = true;
    $ocrMini.hidden = true;
    ocrMinimized = false;
    ocrQueue = [];
    if (recipeOcrTarget != null) {
      const applied = ocrQueue.some(q => q.status === 'applied');
      if (!applied) recipeOcrTarget = null;
    }
  }
  function minimizeOcr() {
    ocrMinimized = true;
    $ocrModal.hidden = true;
    $ocrMini.hidden = false;
    refreshMiniWidget();
  }
  function maximizeOcr() {
    ocrMinimized = false;
    $ocrMini.hidden = true;
    $ocrModal.hidden = false;
    refreshOcrUI();
  }
  function killSession() {
    const unapplied = ocrQueue.filter(q => q.status !== 'applied' && q.status !== 'skipped' && q.status !== 'error');
    if (unapplied.length && !confirm(`Fermer la session OCR ?\n${unapplied.length} image(s) seront perdues.`)) return;
    $ocrMini.hidden = true;
    $ocrModal.hidden = true;
    ocrMinimized = false;
    ocrQueue = [];
    refreshOcrUI();
  }

  function refreshMiniWidget() {
    if (!ocrMinimized) return;
    const cnt = ocrQueue.length;
    const ready = ocrQueue.filter(q => q.status === 'ready').length;
    const applied = ocrQueue.filter(q => q.status === 'applied').length;
    const analyzing = ocrQueue.filter(q => q.status === 'analyzing').length;
    const pending = ocrQueue.filter(q => q.status === 'pending').length;
    const errors = ocrQueue.filter(q => q.status === 'error').length;
    const compressing = ocrQueue.filter(q => q.status === 'compressing').length;
    const totalToProcess = cnt;
    const processed = applied + ocrQueue.filter(q => q.status === 'skipped' || q.status === 'error' || q.status === 'ready').length;
    let txt;
    const allDone = !analyzing && !pending && !compressing;
    if (allDone && ready > 0) {
      txt = `✓ ${ready} prêt${ready>1?'s':''} à valider${errors?` · ${errors} err`:''}`;
      $ocrMini.classList.add('done');
    } else if (analyzing) {
      txt = `analyse… ${processed}/${totalToProcess}${ready?` · ${ready} prêt${ready>1?'s':''}`:''}`;
      $ocrMini.classList.remove('done');
    } else if (pending || compressing) {
      txt = `${pending+compressing} en file · clique pour analyser`;
      $ocrMini.classList.remove('done');
    } else if (applied || errors) {
      txt = applied ? `✓ tout traité (${applied} appliqué${applied>1?'s':''})` : `${errors} erreur${errors>1?'s':''}`;
      $ocrMini.classList.toggle('done', !errors);
    } else {
      txt = `${cnt} image${cnt>1?'s':''}`;
      $ocrMini.classList.remove('done');
    }
    $ocrMiniStatus.textContent = txt;
    const pct = totalToProcess > 0 ? Math.round(processed * 100 / totalToProcess) : 0;
    $ocrMiniBar.style.width = pct + '%';
  }

  function showToast(msg, opts = {}) {
    const $msg = document.getElementById('toast-msg');
    const $icon = document.getElementById('toast-icon');
    const $action = document.getElementById('toast-action');
    $msg.textContent = msg;
    $icon.textContent = opts.icon || (opts.error ? '⚠' : '✓');
    $toast.classList.toggle('error', !!opts.error);
    if (opts.action) {
      $action.hidden = false;
      $action.textContent = opts.actionLabel || 'Voir →';
      $action.onclick = () => {
        $toast.hidden = true;
        clearTimeout(toastTimer);
        opts.action();
      };
    } else {
      $action.hidden = true;
    }
    $toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $toast.hidden = true; }, opts.duration || 7000);
  }

  async function ingestOcrFiles(files) {
    for (const file of files) {
      if (!file || !file.type.startsWith('image/')) continue;
      const id = 'q' + (++ocrCounter);
      const item = {
        id, file,
        thumb: null, image: null,
        status: 'compressing',
        result: null, error: null,
        expanded: false,
        selectedItemId: null,
        selectedPrice: null
      };
      ocrQueue.push(item);
      refreshOcrUI();
      try {
        const compressed = await compressImage(file);
        item.thumb = compressed.thumb;
        item.image = compressed.image;
        item.status = 'pending';
      } catch (e) {
        item.status = 'error';
        item.error = "Impossible de lire l'image";
      }
      refreshOcrUI();
    }
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const MAX_W = 1280;
        let w = img.naturalWidth, h = img.naturalHeight;
        if (w > MAX_W) { h = Math.round(h * MAX_W / w); w = MAX_W; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const b64 = dataUrl.split(',')[1];
        const bytes = Math.round(b64.length * 0.75);
        // thumb 96px
        const TW = 96;
        const th = Math.round(h * TW / w);
        const tcanvas = document.createElement('canvas');
        tcanvas.width = TW; tcanvas.height = th;
        tcanvas.getContext('2d').drawImage(img, 0, 0, TW, th);
        const thumb = tcanvas.toDataURL('image/jpeg', 0.7);
        URL.revokeObjectURL(url);
        resolve({
          thumb,
          image: { b64, mime: 'image/jpeg', dataUrl, w, h, bytes, origSize: file.size, name: file.name }
        });
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load')); };
      img.src = url;
    });
  }

  async function processOcrQueue() {
    if (ocrProcessing) return;
    const pending = ocrQueue.filter(q => q.status === 'pending');
    if (!pending.length) return;
    const startCount = pending.length;
    ocrProcessing = true;
    refreshOcrUI();
    for (const q of pending) {
      if (q.status !== 'pending') continue; // re-check (user may have removed)
      q.status = 'analyzing';
      refreshOcrUI();
      refreshMiniWidget();
      try {
        const r = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_b64: q.image.b64, mime: q.image.mime, model: getNimModel(), nim_key: getNimKey() })
        });
        const j = await r.json();
        if (!r.ok || !j.ok) {
          q.status = 'error';
          q.error = j.error || 'inconnue';
          if (j.details) q.error += ' : ' + (j.details.slice ? j.details.slice(0, 120) : '');
        } else {
          q.status = 'ready';
          q.result = j.data;
          q.model = j.model;
          q.fallbackUsed = !!j.fallback_used;
          q.expanded = true;
          // pré-sélection : meilleur match + prix moyen (ou x1 fallback)
          if (recipeOcrTarget != null) {
            q.selectedItemId = recipeOcrTarget;
          } else {
            const matches = j.data.name ? findMatches(j.data.name, 6) : [];
            q.selectedItemId = matches[0]?.item?.id || null;
          }
          q.selectedPrice =
            j.data.avg_per_unit ??
            j.data.price_x1 ??
            (j.data.price_x10 != null ? Math.round(j.data.price_x10 / 10) : null) ??
            (j.data.price_x100 != null ? Math.round(j.data.price_x100 / 100) : null) ??
            null;
        }
      } catch (e) {
        q.status = 'error';
        q.error = `Réseau : ${e.message}`;
      }
      refreshOcrUI();
      refreshMiniWidget();
    }
    ocrProcessing = false;
    refreshOcrUI();
    refreshMiniWidget();
    // Notif si on est minimisé et que tout est fini
    if (ocrMinimized) {
      const ready = ocrQueue.filter(q => q.status === 'ready').length;
      const errors = ocrQueue.filter(q => q.status === 'error').length;
      if (ready > 0) {
        showToast(`${ready} OCR terminé${ready>1?'s':''} · prêt à valider${errors?` (${errors} erreur${errors>1?'s':''})`:''}`, {
          icon: '✓',
          action: maximizeOcr,
          actionLabel: 'Ouvrir →',
          duration: 12000
        });
      } else if (errors) {
        showToast(`${errors} erreur${errors>1?'s':''} OCR · vérifie les détails`, {
          error: true,
          icon: '⚠',
          action: maximizeOcr,
          actionLabel: 'Ouvrir →',
          duration: 12000
        });
      }
    }
  }

  function pillFor(status) {
    const labels = {
      compressing: 'compression…',
      pending: 'en file',
      analyzing: 'analyse…',
      ready: 'prêt',
      applied: '✓ appliqué',
      skipped: 'ignoré',
      error: '⚠ erreur'
    };
    return `<span class="ocr-pill ${status}">${labels[status] || status}</span>`;
  }

  function refreshOcrUI() {
    // status header
    const cnt = ocrQueue.length;
    const ready = ocrQueue.filter(q => q.status === 'ready').length;
    const pending = ocrQueue.filter(q => q.status === 'pending').length;
    const analyzing = ocrQueue.filter(q => q.status === 'analyzing').length;
    const applied = ocrQueue.filter(q => q.status === 'applied').length;
    const skipped = ocrQueue.filter(q => q.status === 'skipped').length;
    const err = ocrQueue.filter(q => q.status === 'error').length;
    if (cnt === 0) {
      $ocrStatus.className = 'ocr-status';
      $ocrStatus.textContent = "Aucune image en file…";
    } else if (analyzing) {
      $ocrStatus.className = 'ocr-status busy';
      $ocrStatus.textContent = `Analyse en cours… (${ocrQueue.findIndex(q => q.status === 'analyzing') + 1}/${cnt})`;
    } else {
      $ocrStatus.className = 'ocr-status';
      const parts = [];
      if (pending) parts.push(`${pending} en file`);
      if (ready) parts.push(`${ready} prêt${ready>1?'s':''}`);
      if (applied) parts.push(`${applied} appliqué${applied>1?'s':''}`);
      if (skipped) parts.push(`${skipped} ignoré${skipped>1?'s':''}`);
      if (err) parts.push(`${err} erreur${err>1?'s':''}`);
      $ocrStatus.textContent = parts.join(' · ') || `${cnt} image${cnt>1?'s':''}`;
    }
    $ocrAnalyze.disabled = !pending || ocrProcessing;
    $ocrAnalyze.textContent = pending > 1 ? `Analyser les ${pending} →` : 'Analyser →';
    $ocrClearAll.hidden = cnt === 0;
    refreshMiniWidget();

    // queue
    $ocrQueue.innerHTML = ocrQueue.map(renderCardHtml).join('');
    bindOcrCardEvents();
  }

  function renderCardHtml(q) {
    const cardClass = ['ocr-card', q.expanded ? 'expanded' : '', (q.status === 'applied' || q.status === 'skipped') ? 'done' : ''].filter(Boolean).join(' ');
    const subParts = [];
    if (q.image) subParts.push(`${q.image.w}×${q.image.h}`);
    if (q.image) subParts.push(`${(q.image.bytes/1024).toFixed(0)} KB`);
    if (q.model) {
      const short = q.model.replace('meta/llama-3.2-', '').replace('-instruct', '').replace('microsoft/', '');
      subParts.push(`${short}${q.fallbackUsed ? ' ⤺' : ''}`);
    }
    const sub = subParts.join(' · ') || (q.file?.name || '');
    const title = q.result?.name ? escapeHtml(q.result.name) : (q.file?.name || 'image');

    let body = '';
    if (q.expanded) {
      if (q.status === 'ready') body = renderCardBody(q);
      else if (q.status === 'error') body = `<div class="ocr-card-body" style="color:var(--danger);font-size:12px">${escapeHtml(q.error || 'erreur')}</div>`;
    }
    return `<div class="${cardClass}" data-qid="${q.id}">
      <div class="ocr-card-head" data-toggle="${q.id}">
        <div class="ocr-card-thumb">${q.thumb ? `<img src="${q.thumb}">` : ''}</div>
        <div style="min-width:0">
          <div class="ocr-card-title">${title}</div>
          <div class="ocr-card-sub">${sub}</div>
        </div>
        ${pillFor(q.status)}
        <div class="ocr-card-actions">
          ${q.status !== 'applied' && q.status !== 'skipped' ? `<button data-remove="${q.id}" title="Retirer">×</button>` : ''}
        </div>
      </div>
      ${body}
    </div>`;
  }

  function renderCardBody(q) {
    const d = q.result;
    const fmtNum = v => v == null ? '—' : Number(v).toLocaleString('fr-FR').replace(/ /g, ' ');

    // candidats prix unité (cliquables en bas)
    const candidates = [];
    if (d.avg_per_unit != null) candidates.push({ key: 'moyen', value: Number(d.avg_per_unit), label: 'Prix moyen' });
    if (d.price_x1 != null) candidates.push({ key: 'x1', value: Number(d.price_x1), label: 'x1 (le moins cher)' });
    if (d.price_x10 != null) candidates.push({ key: 'x10', value: Math.round(Number(d.price_x10) / 10), label: 'x10 ÷ 10' });
    if (d.price_x100 != null) candidates.push({ key: 'x100', value: Math.round(Number(d.price_x100) / 100), label: 'x100 ÷ 100' });

    // résumé top : lot prices (gauche, petit) + prix moyen (droite, gros)
    const lotsHtml = `<div class="ocr-lots">
      <div class="ocr-lots-label">Prix extraits HDV</div>
      <div class="ocr-lot"><span class="q">x1</span><span class="v">${fmtNum(d.price_x1)}</span></div>
      <div class="ocr-lot"><span class="q">x10</span><span class="v">${fmtNum(d.price_x10)}</span></div>
      <div class="ocr-lot"><span class="q">x100</span><span class="v">${fmtNum(d.price_x100)}</span></div>
    </div>`;
    const avgHtml = `<div class="ocr-avg">
      <div class="lbl">Prix moyen conseillé</div>
      <div class="val">${d.avg_per_unit != null ? fmtNum(d.avg_per_unit) : '—'}</div>
      <div class="u">${d.avg_per_unit != null ? 'kamas/u' : ''}</div>
    </div>`;
    const metaHtml = `<div class="ocr-meta-line">
      ${d.name ? `<span class="nm">${escapeHtml(d.name)}</span>` : ''}
      ${d.level != null ? `<span>niv ${d.level}</span>` : ''}
      ${d.pods != null ? `<span>${d.pods} pods</span>` : ''}
      ${d.lot_quantity != null ? `<span>lot ×${d.lot_quantity} = ${fmtNum(d.lot_price)}</span>` : ''}
    </div>`;

    // Astuce x10 : si vendre en x10 rapporte ≥15% de plus par unité que x1
    let hintHtml = '';
    const targetIdForHint = recipeOcrTarget != null ? recipeOcrTarget : q.selectedItemId;
    if (d.price_x1 != null && d.price_x10 != null && targetIdForHint != null) {
      const x1 = Number(d.price_x1);
      const x10u = Number(d.price_x10) / 10;
      if (x1 > 0) {
        const pct = ((x10u / x1) - 1) * 100;
        const hintKey = 'x10:' + targetIdForHint;
        if (pct >= 15 && !state.hiddenHints?.[hintKey]) {
          hintHtml = `<div class="ocr-hint" data-hint-key="${escapeHtml(hintKey)}" data-hint-item="${escapeHtml(String(targetIdForHint))}">
            <span class="ic" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5 L7 12.5 M3 8.5 L7 12.5 L11 8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" transform="rotate(-90 7 7)"/></svg>
            </span>
            <span>vendre en <b>x10</b> rapporte <b>+${pct.toFixed(0)}%</b> par unité (${fmtKamas(Math.round(x10u))}/u en lot vs ${fmtKamas(x1)}/u à l'unité)</span>
            <span class="dismiss" title="Masquer cette astuce" aria-label="Masquer">×</span>
          </div>`;
        }
      }
    }

    let matchHtml = '';
    if (recipeOcrTarget != null) {
      let name = '?';
      const id = recipeOcrTarget;
      if (typeof id === 'number') name = BY_ID.get(id)?.name || ('#' + id);
      else if (typeof id === 'string' && id.startsWith('i')) name = ITEMS_BY_ID.get(+id.slice(1))?.name || id;
      matchHtml = `<div class="ocr-match"><span style="color:var(--accent);font-weight:700">→ ${escapeHtml(name)}</span> <span style="color:var(--text-mute);font-size:11px">(cible imposée par la recette)</span></div>`;
    } else {
      const matches = d.name ? findMatches(d.name, 6) : [];
      const pick = matches.find(m => m.item.id === q.selectedItemId)?.item || matches[0]?.item;
      matchHtml = pick
        ? `<div class="ocr-match">
            <div class="img"><img src="${iconUrl(pick)}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'ph',textContent:'?'}))"></div>
            <div class="nm-block">
              <div class="nm">${escapeHtml(pick.name)}</div>
              <div class="meta">${escapeHtml(pick.type || '')} · niv ${pick.level || '?'}</div>
            </div>
            <select class="fix" data-pick="${q.id}">
              ${matches.map(m => `<option value="${m.item.id}"${m.item.id===q.selectedItemId?' selected':''}>${escapeHtml(m.item.name)} (${(m.score*100).toFixed(0)}%)</option>`).join('')}
            </select>
          </div>`
        : `<div class="ocr-match"><span style="color:var(--danger)">Aucun item ne correspond à "${escapeHtml(d.name || '?')}".</span></div>`;
    }

    return `<div class="ocr-card-body">
      ${metaHtml}
      <div class="ocr-prices-summary">
        ${lotsHtml}
        ${avgHtml}
      </div>
      ${hintHtml}
      ${matchHtml}
      <div class="ocr-prices-label">Choisir le prix de référence</div>
      <div class="ocr-prices">
        ${candidates.map(c => `<div class="ocr-price-card${c.value === q.selectedPrice ? ' selected' : ''}" data-price="${q.id}" data-value="${c.value}">
          <div class="label">${escapeHtml(c.label)}</div>
          <div class="val">${fmtKamas(c.value)}</div>
        </div>`).join('') || `<div style="color:var(--text-mute)">Aucun prix détecté.</div>`}
      </div>
      <div class="ocr-confirm-row">
        <span class="info" style="font-size:12px;color:var(--text-soft)">→ <span class="selected-price">${q.selectedPrice != null ? fmtKamas(q.selectedPrice) : '—'}</span> /u</span>
        <div class="spacer"></div>
        <button class="btn-mini" data-skip="${q.id}">Ignorer</button>
        <button class="btn-primary" data-apply="${q.id}" ${q.selectedItemId != null && q.selectedPrice != null ? '' : 'disabled'}>Appliquer ✓</button>
      </div>
    </div>`;
  }

  function bindOcrCardEvents() {
    for (const el of $ocrQueue.querySelectorAll('[data-toggle]')) {
      el.addEventListener('click', e => {
        if (e.target.closest('button, select')) return;
        const q = ocrQueue.find(x => x.id === el.dataset.toggle);
        if (q && q.status !== 'compressing' && q.status !== 'analyzing') {
          q.expanded = !q.expanded;
          refreshOcrUI();
        }
      });
    }
    for (const btn of $ocrQueue.querySelectorAll('[data-remove]')) {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const id = btn.dataset.remove;
        ocrQueue = ocrQueue.filter(x => x.id !== id);
        refreshOcrUI();
      });
    }
    for (const card of $ocrQueue.querySelectorAll('[data-price]')) {
      card.addEventListener('click', e => {
        const q = ocrQueue.find(x => x.id === card.dataset.price);
        if (!q) return;
        q.selectedPrice = Number(card.dataset.value);
        refreshOcrUI();
      });
    }
    for (const sel of $ocrQueue.querySelectorAll('[data-pick]')) {
      sel.addEventListener('change', e => {
        e.stopPropagation();
        const q = ocrQueue.find(x => x.id === sel.dataset.pick);
        if (q) { q.selectedItemId = +sel.value; refreshOcrUI(); }
      });
      sel.addEventListener('click', e => e.stopPropagation());
    }
    for (const btn of $ocrQueue.querySelectorAll('[data-skip]')) {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const q = ocrQueue.find(x => x.id === btn.dataset.skip);
        if (q) { q.status = 'skipped'; q.expanded = false; refreshOcrUI(); }
      });
    }
    for (const btn of $ocrQueue.querySelectorAll('[data-apply]')) {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        applyOcrCard(btn.dataset.apply);
      });
    }
    for (const hint of $ocrQueue.querySelectorAll('[data-hint-key]')) {
      hint.addEventListener('click', e => {
        e.stopPropagation();
        const key = hint.dataset.hintKey;
        const itemRef = hint.dataset.hintItem;
        let itemName = itemRef;
        if (/^\d+$/.test(itemRef)) itemName = BY_ID.get(+itemRef)?.name || '#' + itemRef;
        else if (itemRef.startsWith('i')) itemName = ITEMS_BY_ID.get(+itemRef.slice(1))?.name || itemRef;
        const ok = confirm(
          `Masquer définitivement l'astuce "vendre en x10" pour :\n${itemName} ?\n\n` +
          `Certaines ressources se droppent rarement en lot de 10, pas la peine que je te le rappelle à chaque scan.`
        );
        if (ok) {
          if (!state.hiddenHints) state.hiddenHints = {};
          state.hiddenHints[key] = true;
          saveState();
          refreshOcrUI();
        }
      });
    }
  }

  function applyOcrCard(qid) {
    const q = ocrQueue.find(x => x.id === qid);
    if (!q || q.selectedPrice == null) return;
    const targetId = recipeOcrTarget != null ? recipeOcrTarget : q.selectedItemId;
    if (targetId == null) return;
    setPrice(targetId, q.selectedPrice);
    const f = getCurrentFolder();
    if (typeof targetId === 'number' && f && !f.items.includes(targetId)) f.items.push(targetId);
    saveState();
    q.status = 'applied';
    q.expanded = false;
    let label = '';
    if (typeof targetId === 'number') label = BY_ID.get(targetId)?.name || ('#' + targetId);
    else if (typeof targetId === 'string' && targetId.startsWith('i')) label = ITEMS_BY_ID.get(+targetId.slice(1))?.name || targetId;
    flashStatus(`Prix enregistré : ${label} = ${fmtKamas(q.selectedPrice)}/u`);
    refreshOcrUI();
    render();
    // Si on est en mode recette, on retourne tout de suite à la recette après le 1er apply
    if (recipeOcrTarget != null) {
      setTimeout(() => {
        closeOcr();
        $recipeModal.hidden = false;
        renderRecipe();
        recipeOcrTarget = null;
      }, 400);
    }
  }

  // --- settings modal (clé NIM en localStorage, plus de /api/config serveur)
  const $setModal = document.getElementById('modal-settings');
  const $setKey = document.getElementById('set-nim-key');
  const $setModel = document.getElementById('set-nim-model');
  const $setStatus = document.getElementById('set-status');

  function openSettings() {
    $setStatus.textContent = '';
    $setStatus.className = 'hint';
    const $modelPick = document.getElementById('set-nim-model-pick');
    const presetModels = Array.from($modelPick.options).map(o => o.value).filter(v => v !== '__custom__');
    const hasKey = hasNimKey();
    $setKey.value = '';
    $setKey.placeholder = hasKey ? '✓ clé déjà configurée, saisir une nouvelle pour la remplacer' : 'nvapi-…';
    const m = getNimModel();
    if (presetModels.includes(m)) {
      $modelPick.value = m;
      $setModel.hidden = true;
    } else {
      $modelPick.value = '__custom__';
      $setModel.hidden = false;
      $setModel.value = m;
    }
    $setModal.hidden = false;
    setTimeout(() => $setKey.focus(), 50);
  }
  function closeSettings() { $setModal.hidden = true; }

  function saveSettings() {
    const $modelPick = document.getElementById('set-nim-model-pick');
    if ($setKey.value.trim()) setNimKey($setKey.value.trim());
    const pickedModel = $modelPick.value === '__custom__' ? $setModel.value.trim() : $modelPick.value;
    if (pickedModel) setNimModel(pickedModel);
    $setStatus.className = 'hint success';
    $setStatus.textContent = '✓ Réglages enregistrés';
    setTimeout(closeSettings, 600);
  }

  // Test une clé NIM via le Worker. NIM peut renvoyer 502 (image 1×1 illisible) — on traite ça comme "clé valide".
  const TINY_PIXEL_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  async function testNimKey() {
    const candidate = ($setKey.value || '').trim() || getNimKey();
    if (!candidate) {
      $setStatus.className = 'hint error';
      $setStatus.textContent = '✗ Aucune clé à tester';
      return;
    }
    $setStatus.className = 'hint';
    $setStatus.textContent = '⌛ Test en cours…';
    try {
      const r = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_b64: TINY_PIXEL_B64, mime: 'image/png', nim_key: candidate, model: DEFAULT_MODEL, no_fallback: true })
      });
      // 200 ou 502 → la clé a été acceptée par NIM (502 = NIM répond mais ne parse pas le 1×1, c'est normal)
      // 401/403 → clé invalide. 429 → rate limit. Autres → erreur réseau / proxy.
      if (r.status === 200 || r.status === 502) {
        $setStatus.className = 'hint success';
        $setStatus.textContent = '✓ Clé valide';
      } else {
        const j = await r.json().catch(() => ({}));
        $setStatus.className = 'hint error';
        $setStatus.textContent = `✗ ${j.error || 'Clé invalide (HTTP ' + r.status + ')'}`;
      }
    } catch (e) {
      $setStatus.className = 'hint error';
      $setStatus.textContent = `✗ Erreur réseau : ${e.message}`;
    }
  }

  // --- recipe modal
  const $recipeModal = document.getElementById('modal-recipe');
  const $recipeSearch = document.getElementById('recipe-search');
  const $recipeSuggest = document.getElementById('recipe-suggest');
  const $recipeDetail = document.getElementById('recipe-detail');
  let recipeCurrentItem = null;
  let recipeQty = 1;

  function openRecipe() {
    $recipeSearch.value = '';
    $recipeSuggest.hidden = true;
    $recipeDetail.hidden = true;
    $recipeDetail.innerHTML = '';
    recipeCurrentItem = null;
    recipeQty = 1;
    $recipeModal.hidden = false;
    setTimeout(() => $recipeSearch.focus(), 50);
  }
  function closeRecipe() { $recipeModal.hidden = true; }

  function renderRecipeSuggest(q) {
    q = (q || '').trim().toLowerCase();
    if (!q) { $recipeSuggest.hidden = true; return; }
    const qNorm = normalize(q);
    const matches = RECIPES
      .map(it => ({ it, score: similarity(qNorm, normalize(it.name)) + (normalize(it.name).includes(qNorm) ? 0.2 : 0) }))
      .filter(x => x.score > 0.25)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);
    if (!matches.length) {
      $recipeSuggest.innerHTML = `<div class="empty">Aucun item craftable trouvé.</div>`;
      $recipeSuggest.hidden = false;
      return;
    }
    $recipeSuggest.innerHTML = matches.map(m => {
      const it = m.it;
      return `<div class="row" data-pick-recipe="${it.id}">
        <div class="img-w"><img src="${itemIconUrl(it)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'ph',style:'color:var(--text-mute)',textContent:'·'}))"></div>
        <div>
          <div class="nm">${escapeHtml(it.name)}</div>
          <div class="meta">${it.ing.length} ingrédient${it.ing.length>1?'s':''} · niv ${it.level || '?'}</div>
        </div>
        <div class="lvl">${(m.score*100).toFixed(0)}%</div>
      </div>`;
    }).join('');
    $recipeSuggest.hidden = false;
    for (const r of $recipeSuggest.querySelectorAll('[data-pick-recipe]')) {
      r.addEventListener('click', () => loadRecipe(+r.dataset.pickRecipe));
    }
  }

  function loadRecipe(itemId) {
    const it = ITEMS_BY_ID.get(itemId);
    if (!it) return;
    recipeCurrentItem = it;
    recipeQty = 1;
    $recipeSearch.value = it.name;
    $recipeSuggest.hidden = true;
    renderRecipe();
  }

  function renderRecipe() {
    const it = recipeCurrentItem;
    if (!it) return;
    let total = 0, missing = 0, knownTotal = 0;
    const rowsHtml = it.ing.map(ing => {
      const resolved = resolveIngredient(ing);
      const qty = ing.n * recipeQty;
      const price = resolved.priceableId != null ? getPrice(resolved.priceableId) : null;
      const sub = price != null ? price * qty : null;
      if (sub != null) { knownTotal += sub; }
      else { missing++; }
      total = knownTotal;
      const imgHtml = resolved.iconUrl
        ? `<img src="${resolved.iconUrl}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'ph',textContent:'?'}))">`
        : `<span class="ph">?</span>`;
      const niv = resolved.level !== '?' ? `niv ${resolved.level}` : '';
      const type = resolved.type || '';
      const priceVal = price != null ? fmtKamas(price) : '';
      const pid = resolved.priceableId;
      const isItemIngredient = resolved.kind === 'item';
      const itemIngredientHasRecipe = isItemIngredient && Array.isArray(ITEMS_BY_OFFICIAL.get(ing.id)?.ing) && ITEMS_BY_OFFICIAL.get(ing.id).ing.length > 0;
      return `<div class="recipe-row${price == null ? ' warn' : ''}" data-ing-id="${ing.id}">
        <div class="img-w">${imgHtml}</div>
        <div>
          <div class="nm">${escapeHtml(resolved.name)}${isItemIngredient ? ' <span style="font-size:10px;color:var(--accent);font-weight:600">[item]</span>' : ''}${itemIngredientHasRecipe ? ` <button class="ocr-btn" style="font-size:10px;padding:1px 5px" data-recipe-explore="${ing.id}" title="Voir la recette de cet item">→ recette</button>` : ''}</div>
          <div class="meta">${escapeHtml(type)}</div>
        </div>
        <div class="qty"><span class="x">×</span>${qty}</div>
        <div class="level-cell">${niv}</div>
        <div class="price-cell"><input data-recipe-price="${pid != null ? pid : ''}" value="${priceVal}" placeholder="—" class="${priceVal ? '' : 'empty'}" ${pid == null ? 'disabled' : ''}></div>
        <div class="subtotal ${sub != null ? '' : 'missing'}">${sub != null ? fmtKamas(sub) : '— manquant'}</div>
        <button class="ocr-btn" data-recipe-ocr="${pid != null ? pid : ''}" ${pid == null ? 'disabled' : ''} title="OCR pour combler ce prix">📷</button>
      </div>`;
    }).join('');

    const headerImg = `<img src="${itemIconUrl(it)}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{style:'color:var(--text-mute);font-size:24px',textContent:'?'}))">`;

    const savedCraft = state.crafts.find(c => c.itemId === it.id);
    const savedHdv = savedCraft?.hdvPrice;
    const hdvStr = savedHdv != null ? fmtKamas(savedHdv) : '';
    const marginVal = savedHdv != null ? savedHdv - total : null;
    const marginCls = marginVal == null ? '' : marginVal > 0 ? 'pos' : marginVal < 0 ? 'neg' : '';
    const approx = missing > 0;

    $recipeDetail.innerHTML = `
      <div class="recipe-head">
        <div class="img-w">${headerImg}</div>
        <div class="nm-block">
          <div class="nm">${escapeHtml(it.name)}</div>
          <div class="meta">niv ${it.level || '?'} · ${it.ing.length} ingrédient${it.ing.length>1?'s':''} · ${it.pods || '?'} pods</div>
        </div>
        <div class="qty-control">
          <button id="recipe-qty-minus">−</button>
          <input id="recipe-qty-input" type="number" min="1" max="999" value="${recipeQty}">
          <button id="recipe-qty-plus">+</button>
        </div>
      </div>
      <div class="recipe-rows">${rowsHtml}</div>
      <div class="recipe-foot">
        <div class="ft-block">
          <div class="lbl">COÛT INGRÉDIENTS</div>
          <div class="val total ${approx ? 'approx' : ''}">${approx ? '~' : ''}${fmtKamas(total) || '0'}</div>
          ${approx ? `<div class="sub warn">${missing} manquant${missing>1?'s':''} sur ${it.ing.length}</div>` : ''}
        </div>
        <div class="ft-block">
          <div class="lbl">PRIX HDV (à l'unité)</div>
          <div class="hdv-row">
            <input id="recipe-hdv" type="text" value="${hdvStr}" placeholder="—" inputmode="text">
            <span class="unit">/u</span>
          </div>
        </div>
        <div class="ft-block">
          <div class="lbl">MARGE NETTE</div>
          <div class="val margin ${marginCls}">${marginVal == null ? '—' : (approx ? '~' : '') + (marginVal >= 0 ? '+' : '') + fmtKamas(marginVal)}</div>
          ${marginVal != null && approx ? `<div class="sub warn">estimation</div>` : ''}
        </div>
        <div class="spacer"></div>
        <div class="ft-actions">
          ${savedCraft ? `<button class="btn-mini" id="recipe-untrack">retirer du suivi</button>` : ''}
          <button class="btn-primary" id="recipe-save">${savedCraft ? 'mettre à jour' : 'suivre ce craft'} →</button>
        </div>
      </div>
    `;
    $recipeDetail.hidden = false;

    document.getElementById('recipe-qty-input').addEventListener('input', e => {
      const v = Math.max(1, Math.min(999, parseInt(e.target.value) || 1));
      recipeQty = v;
      renderRecipe();
    });
    document.getElementById('recipe-qty-plus').addEventListener('click', () => { recipeQty++; renderRecipe(); });
    document.getElementById('recipe-qty-minus').addEventListener('click', () => { if (recipeQty > 1) { recipeQty--; renderRecipe(); } });

    for (const inp of $recipeDetail.querySelectorAll('[data-recipe-price]')) {
      inp.addEventListener('focus', () => inp.select());
      inp.addEventListener('blur', () => {
        const id = inp.dataset.recipePrice;
        if (!id) return;
        const v = parseKamas(inp.value);
        const key = isNaN(+id) ? id : +id;  // garde "i123" comme string, ou 1611 comme int
        setPrice(key, v);
        saveState();
        renderRecipe();
      });
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') inp.blur();
      });
    }
    for (const btn of $recipeDetail.querySelectorAll('[data-recipe-ocr]')) {
      btn.addEventListener('click', () => {
        const id = btn.dataset.recipeOcr;
        if (!id) return;
        recipeOcrTarget = isNaN(+id) ? id : +id;
        closeRecipe();
        openOcr();
      });
    }
    for (const btn of $recipeDetail.querySelectorAll('[data-recipe-explore]')) {
      btn.addEventListener('click', () => {
        const officialId = +btn.dataset.recipeExplore;
        const item = ITEMS_BY_OFFICIAL.get(officialId);
        if (item) loadRecipe(item.id);
      });
    }
    const $hdv = document.getElementById('recipe-hdv');
    if ($hdv) {
      $hdv.addEventListener('focus', () => $hdv.select());
      $hdv.addEventListener('blur', () => {
        const v = parseKamas($hdv.value);
        const c = state.crafts.find(x => x.itemId === recipeCurrentItem.id);
        if (c) { c.hdvPrice = v; c.hdvUpdatedAt = Date.now(); saveState(); renderRecipe(); }
        else { renderRecipe(); }  // juste reflow pour montrer la marge live
      });
      $hdv.addEventListener('keydown', e => {
        if (e.key === 'Enter') $hdv.blur();
      });
    }
    const $save = document.getElementById('recipe-save');
    if ($save) {
      $save.addEventListener('click', () => {
        const v = $hdv ? parseKamas($hdv.value) : null;
        saveCraftFromRecipe(recipeCurrentItem.id, recipeQty, v);
        renderRecipe();
        renderFolders();
        flashStatus(`"${recipeCurrentItem.name}" suivi dans Crafts`);
      });
    }
    const $untrack = document.getElementById('recipe-untrack');
    if ($untrack) {
      $untrack.addEventListener('click', () => {
        if (!confirm(`Retirer "${recipeCurrentItem.name}" des crafts suivis ?`)) return;
        state.crafts = state.crafts.filter(c => c.itemId !== recipeCurrentItem.id);
        saveState();
        renderRecipe();
        renderFolders();
      });
    }
  }

  let recipeOcrTarget = null;

  $recipeSearch.addEventListener('input', () => renderRecipeSuggest($recipeSearch.value));
  $recipeSearch.addEventListener('focus', () => renderRecipeSuggest($recipeSearch.value));

  // --- export / import
  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `penates-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const s = JSON.parse(reader.result);
        if (!s.prices || !s.folders) throw new Error('invalid');
        if (!confirm('Cela remplacera tes données actuelles. Continuer ?')) return;
        state = s;
        // re-run migration on imported state
        const now = Date.now();
        for (const [id, v] of Object.entries(state.prices)) {
          if (typeof v === 'number' || typeof v === 'string') {
            state.prices[id] = { value: Number(v) || 0, updatedAt: now };
          }
        }
        currentFolderId = state.currentFolderId || 'all';
        saveState();
        render();
      } catch (e) {
        alert('Fichier invalide');
      }
    };
    reader.readAsText(file);
  }

  // --- transient status
  let flashTimer = null;
  function flashStatus(msg) {
    const tot = document.getElementById('stat-total');
    if (!tot) return;
    const orig = tot.textContent;
    const stat = tot.parentElement;
    const oldHtml = stat.innerHTML;
    stat.innerHTML = `<span style="color:var(--good)">✓ ${escapeHtml(msg)}</span>`;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => { stat.innerHTML = oldHtml; render(); }, 2200);
  }

  // --- utils
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  function render() {
    renderFolders();
    renderHeader();
    renderGrid();
  }

  // --- bind globals
  document.getElementById('search').addEventListener('input', renderGrid);
  document.getElementById('sort').addEventListener('change', renderGrid);
  document.getElementById('btn-add-item').addEventListener('click', openPick);
  document.getElementById('btn-add-folder').addEventListener('click', () => openFolderModal(null));
  document.getElementById('btn-rename').addEventListener('click', () => openFolderModal(currentFolderId));
  document.getElementById('btn-delete-folder').addEventListener('click', deleteCurrentFolder);
  document.getElementById('btn-bulk').addEventListener('click', openBulk);
  document.getElementById('btn-ocr').addEventListener('click', openOcr);
  document.getElementById('ocr-minimize').addEventListener('click', minimizeOcr);
  $ocrMini.addEventListener('click', e => {
    if (e.target.closest('#ocr-mini-close')) return;
    maximizeOcr();
  });
  document.getElementById('ocr-mini-close').addEventListener('click', e => {
    e.stopPropagation();
    killSession();
  });
  document.getElementById('btn-recipe').addEventListener('click', openRecipe);
  document.getElementById('btn-settings').addEventListener('click', openSettings);

  $pickSearch.addEventListener('input', () => renderPickResults($pickSearch.value));

  document.getElementById('folder-save').addEventListener('click', saveFolder);
  $fName.addEventListener('keydown', e => { if (e.key === 'Enter') saveFolder(); });
  for (const b of document.querySelectorAll('.emoji-suggest button')) {
    b.addEventListener('click', () => {
      $fIcon.value = b.dataset.emoji;
      setFolderIcon(b.dataset.emoji);
    });
  }
  $fIcon.addEventListener('input', () => setFolderIcon($fIcon.value.trim()));
  for (const btn of document.querySelectorAll('[data-icon-tab]')) {
    btn.addEventListener('click', () => switchIconTab(btn.dataset.iconTab));
  }
  for (const t of ['res', 'mob']) {
    const $s = document.getElementById('icon-search-' + t);
    if ($s) $s.addEventListener('input', () => renderIconGrid(t));
  }

  document.getElementById('bulk-analyze').addEventListener('click', analyzeBulk);
  $bulkInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); analyzeBulk(); }
  });

  $ocrFile.addEventListener('change', e => {
    if (e.target.files.length) ingestOcrFiles(Array.from(e.target.files));
    e.target.value = '';
  });
  $ocrDrop.addEventListener('dragover', e => { e.preventDefault(); $ocrDrop.classList.add('over'); });
  $ocrDrop.addEventListener('dragleave', () => $ocrDrop.classList.remove('over'));
  $ocrDrop.addEventListener('drop', e => {
    e.preventDefault();
    $ocrDrop.classList.remove('over');
    if (e.dataTransfer.files.length) ingestOcrFiles(Array.from(e.dataTransfer.files));
  });
  $ocrAnalyze.addEventListener('click', processOcrQueue);
  $ocrClearAll.addEventListener('click', () => {
    if (ocrQueue.length && !confirm('Vider toute la file OCR ?')) return;
    ocrQueue = [];
    refreshOcrUI();
  });
  // Paste : récupère TOUTES les images du presse-papier
  document.addEventListener('paste', e => {
    if ($ocrModal.hidden) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    const files = [];
    for (const it of items) {
      if (it.kind === 'file' && it.type.startsWith('image/')) files.push(it.getAsFile());
    }
    if (files.length) {
      ingestOcrFiles(files);
      e.preventDefault();
    }
  });

  document.getElementById('set-save').addEventListener('click', saveSettings);
  $setKey.addEventListener('keydown', e => { if (e.key === 'Enter') saveSettings(); });
  document.getElementById('set-nim-model-pick').addEventListener('change', e => {
    document.getElementById('set-nim-model').hidden = e.target.value !== '__custom__';
  });

  for (const el of document.querySelectorAll('[data-close]')) {
    el.addEventListener('click', () => {
      closePick(); closeFolderModal(); closeBulk(); closeOcr(); closeSettings(); closeRecipe(); closeChangelog(); closeUpdateModal();
    });
  }
  // Overlays : pour OCR, on minimise plutôt que de tuer la session si du contenu existe
  for (const m of [$pickModal, $fModal, $bulkModal, $setModal, document.getElementById('modal-recipe')]) {
    m.addEventListener('click', e => {
      if (e.target === m) {
        closePick(); closeFolderModal(); closeBulk(); closeSettings(); closeRecipe();
      }
    });
  }
  $ocrModal.addEventListener('click', e => {
    if (e.target === $ocrModal) {
      if (ocrQueue.length) minimizeOcr();
      else { $ocrModal.hidden = true; }
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$ocrModal.hidden) {
      if (ocrQueue.length) minimizeOcr();
      else $ocrModal.hidden = true;
      return;
    }
    closePick(); closeFolderModal(); closeBulk(); closeSettings(); closeRecipe(); closeChangelog(); closeUpdateModal();
  });

  document.getElementById('btn-export').addEventListener('click', exportData);
  document.getElementById('btn-import').addEventListener('click', () => document.getElementById('file-import').click());
  document.getElementById('file-import').addEventListener('change', e => {
    if (e.target.files[0]) importData(e.target.files[0]);
    e.target.value = '';
  });

  // --- version & changelog
  const $changelogModal = document.getElementById('modal-changelog');
  const $changelogBody = document.getElementById('changelog-body');
  const $btnChangelog = document.getElementById('btn-changelog');
  let changelogLoaded = false;

  let APP_VERSION = '?';
  fetch('version.json').then(r => r.json()).then(v => {
    APP_VERSION = v.version || '?';
    $btnChangelog.textContent = 'v' + APP_VERSION;
  }).catch(() => { $btnChangelog.textContent = 'v?'; });

  function mdToHtml(md) {
    // mini-parseur markdown : titres, listes, gras, code, liens, blockquote
    const lines = md.split(/\r?\n/);
    let html = '', inList = false, inBlock = false;
    const inline = s => s
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    for (const raw of lines) {
      const ln = raw.replace(/^\s+$/, '');
      if (ln.startsWith('### ')) { if (inList) { html += '</ul>'; inList = false; } html += `<h3>${inline(ln.slice(4))}</h3>`; continue; }
      if (ln.startsWith('## '))  { if (inList) { html += '</ul>'; inList = false; } html += `<h2>${inline(ln.slice(3))}</h2>`; continue; }
      if (ln.startsWith('# '))   { if (inList) { html += '</ul>'; inList = false; } html += `<h1>${inline(ln.slice(2))}</h1>`; continue; }
      if (ln.startsWith('> ')) {
        if (inList) { html += '</ul>'; inList = false; }
        if (!inBlock) { html += '<blockquote>'; inBlock = true; }
        html += inline(ln.slice(2)) + ' ';
        continue;
      }
      if (inBlock) { html += '</blockquote>'; inBlock = false; }
      if (/^\s*[-*]\s/.test(ln)) {
        if (!inList) { html += '<ul>'; inList = true; }
        html += `<li>${inline(ln.replace(/^\s*[-*]\s/, ''))}</li>`;
        continue;
      }
      if (inList) { html += '</ul>'; inList = false; }
      if (ln.trim()) html += `<p>${inline(ln)}</p>`;
    }
    if (inList) html += '</ul>';
    if (inBlock) html += '</blockquote>';
    return html;
  }

  async function openChangelog() {
    $changelogModal.hidden = false;
    if (!changelogLoaded) {
      try {
        const r = await fetch('CHANGELOG.md');
        const md = await r.text();
        $changelogBody.innerHTML = mdToHtml(md);
        changelogLoaded = true;
      } catch (e) {
        $changelogBody.innerHTML = '<p style="color:var(--danger)">Impossible de charger le changelog.</p>';
      }
    }
  }
  function closeChangelog() { $changelogModal.hidden = true; }
  $btnChangelog.addEventListener('click', openChangelog);
  $changelogModal.addEventListener('click', e => { if (e.target === $changelogModal) closeChangelog(); });

  // --- sidebar collapse
  const SIDE_KEY = 'memo-price-sidebar';
  function applySidebarState() {
    const collapsed = localStorage.getItem(SIDE_KEY) === 'collapsed';
    document.body.classList.toggle('sidebar-collapsed', collapsed);
  }
  document.getElementById('btn-collapse').addEventListener('click', () => {
    const isCol = document.body.classList.toggle('sidebar-collapsed');
    localStorage.setItem(SIDE_KEY, isCol ? 'collapsed' : 'expanded');
  });
  applySidebarState();

  // --- onboarding première fois
  const $onboarding = document.getElementById('onboarding');
  function hideOnboarding() { if ($onboarding) $onboarding.hidden = true; }
  document.getElementById('onb-go-settings')?.addEventListener('click', () => {
    hideOnboarding();
    openSettings();
  });
  document.getElementById('onb-skip')?.addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEY_ONBOARDING, '1');
    hideOnboarding();
  });
  document.getElementById('set-test')?.addEventListener('click', testNimKey);

  // --- init
  render();
  if ($onboarding && !hasNimKey() && !localStorage.getItem(STORAGE_KEY_ONBOARDING)) {
    $onboarding.hidden = false;
  }
})();
