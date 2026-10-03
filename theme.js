(function () {
  const SH = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const PAL = { accent: 'blue', accent2: 'indigo', success: 'emerald', highlight: 'teal', warning: 'amber', danger: 'red', purple: 'purple', neutral: 'gray' };
  const FIELDS = [
    ['accent', 'Main accent', 'Buttons, links, active menu item'],
    ['accent2', 'Secondary accent', 'Gradient partner, secondary highlights'],
    ['success', 'Success / Classroom', 'Synced, completed, Google Classroom'],
    ['highlight', 'Highlight', 'Teal accent (banner end colour)'],
    ['warning', 'Warning', 'Pending tasks, notes, to-do'],
    ['danger', 'Danger', 'High priority, delete, sync out'],
    ['purple', 'Purple', 'Classes today, submitted tasks'],
    ['neutral', 'Neutral tint', 'Backgrounds, cards, borders, muted text']
  ];
  const DEF = {
    colors: { accent: '#2563eb', accent2: '#4f46e5', success: '#059669', highlight: '#0d9488', warning: '#d97706', danger: '#dc2626', purple: '#9333ea', neutral: '#6b7280' },
    textLight: '', textDark: '',
    blend: { from: '#2563eb', to: '#4f46e5', angle: 135, strength: 12, logo: true, banner: false, buttons: false, page: false }
  };
  const P = {
    Default: {},
    Ocean: { colors: { accent: '#0891b2', accent2: '#2563eb', danger: '#e11d48', purple: '#7c3aed', neutral: '#64748b' }, blend: { from: '#06b6d4', to: '#2563eb' } },
    Sunset: { colors: { accent: '#ea580c', accent2: '#db2777', success: '#16a34a', highlight: '#e11d48', warning: '#f59e0b', danger: '#b91c1c', purple: '#c026d3', neutral: '#78716c' }, blend: { from: '#f97316', to: '#db2777' } },
    Forest: { colors: { accent: '#16a34a', accent2: '#0d9488', success: '#15803d', highlight: '#65a30d', warning: '#ca8a04', neutral: '#6b7a70' }, blend: { from: '#22c55e', to: '#0d9488' } },
    Violet: { colors: { accent: '#7c3aed', accent2: '#c026d3', highlight: '#db2777', purple: '#6d28d9', neutral: '#706b80' }, blend: { from: '#8b5cf6', to: '#ec4899' } },
    Midnight: { colors: { accent: '#3b82f6', accent2: '#8b5cf6', success: '#10b981', highlight: '#06b6d4', warning: '#f59e0b', danger: '#ef4444', purple: '#a855f7', neutral: '#566a99' }, blend: { from: '#3b82f6', to: '#8b5cf6', page: true, buttons: true } }
  };
  const clone = o => JSON.parse(JSON.stringify(o));


  const h2hsl = h => {
    const r = parseInt(h.slice(1, 3), 16) / 255, g = parseInt(h.slice(3, 5), 16) / 255, b = parseInt(h.slice(5, 7), 16) / 255;
    const M = Math.max(r, g, b), m = Math.min(r, g, b), l = (M + m) / 2, d = M - m;
    let s = 0, H = 0;
    if (d) { s = d / (1 - Math.abs(2 * l - 1)); H = M === r ? ((g - b) / d) % 6 : M === g ? (b - r) / d + 2 : (r - g) / d + 4; H *= 60; if (H < 0) H += 360; }
    return [H, s * 100, l * 100];
  };
  const hsl2rgb = (H, S, L) => {
    S /= 100; L /= 100;
    const c = (1 - Math.abs(2 * L - 1)) * S, x = c * (1 - Math.abs((H / 60) % 2 - 1)), m = L - c / 2;
    const [r, g, b] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(H / 60) % 6];
    return [r + m, g + m, b + m].map(v => Math.round(v * 255));
  };
  const GL = [98, 96, 91, 84, 65, 46, 35, 27, 17, 11, 4];
  const GM = [2.2, 1.5, 1.4, 1.3, 1.2, 1, 1.5, 2.1, 3.1, 4.3, 7.9];
  const GC = [35, 30, 25, 22, 20, 30, 35, 45, 55, 65, 80];
  const LF = { 50: .97, 100: .9, 200: .72, 300: .5, 400: .3, 500: .12 };
  const DK = { 700: .17, 800: .34, 900: .5, 950: .68 };
  function shades(pal, hex) {
    const [H, S, L] = h2hsl(hex), o = {};
    SH.forEach((s, i) => {
      let l, sa = S;
      if (pal === 'gray') { l = GL[i]; sa = Math.min(GC[i], S * GM[i]); }
      else l = s < 600 ? L + (97 - L) * LF[s] : s === 600 ? L : L * (1 - DK[s]);
      o[s] = hsl2rgb(H, Math.min(100, sa), l).join(' ');
    });
    return o;
  }


  const tc = {};
  Object.values(PAL).forEach(n => { tc[n] = {}; SH.forEach(s => tc[n][s] = `rgb(var(--${n}-${s}) / <alpha-value>)`); });
  tailwind.config = { darkMode: 'class', theme: { extend: { colors: tc } } };

 
  let T = clone(DEF);
  try {
    const s = JSON.parse(localStorage.getItem('shixy_theme'));
    if (s) T = { colors: { ...DEF.colors, ...s.colors }, textLight: s.textLight || '', textDark: s.textDark || '', blend: { ...DEF.blend, ...s.blend } };
  } catch (e) {}

  const css = document.createElement('style');
  css.textContent = `
    html.blend-logo #sidebar .bg-gradient-to-tr, html.blend-logo #app-name-text,
    html.blend-banner .from-emerald-600.to-teal-700, html.blend-buttons .bg-blue-600
      { background-image: linear-gradient(var(--bl-angle), var(--bl-from), var(--bl-to)); }
    html.blend-buttons .bg-blue-600:hover { filter: brightness(.92); }
    html.blend-page main { background-image: linear-gradient(var(--bl-angle),
      color-mix(in srgb, var(--bl-from) var(--bl-str), transparent),
      color-mix(in srgb, var(--bl-to) var(--bl-str), transparent)); }`;
  const ts = document.createElement('style');
  document.head.append(css, ts);

  function apply() {
    const r = document.documentElement, b = T.blend;
    Object.entries(PAL).forEach(([k, n]) => {
      const sh = shades(n, T.colors[k]);
      SH.forEach(s => r.style.setProperty(`--${n}-${s}`, sh[s]));
    });
    r.style.setProperty('--bl-from', b.from);
    r.style.setProperty('--bl-to', b.to);
    r.style.setProperty('--bl-angle', b.angle + 'deg');
    r.style.setProperty('--bl-str', b.strength + '%');
    ['logo', 'banner', 'buttons', 'page'].forEach(k => r.classList.toggle('blend-' + k, !!b[k]));
    ts.textContent =
      (T.textLight ? `html:not(.dark) .text-gray-800, html:not(.dark) .text-gray-700 { color: ${T.textLight}; }` : '') +
      (T.textDark ? `html.dark .dark\\:text-white, html.dark .dark\\:text-gray-100, html.dark .dark\\:text-gray-200 { color: ${T.textDark}; }` : '');
  }
  apply();

  
  const rgbv = (pal, s, a) => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(`--${pal}-${s}`).trim().split(/\s+/).join(',');
    return a == null ? `rgb(${v})` : `rgba(${v},${a})`;
  };
  function charts() {
    try {
      if (chartGradesObj) { chartGradesObj.data.datasets[0].backgroundColor = rgbv('blue', 500, .7); chartGradesObj.update(); }
      if (chartTasksObj) { chartTasksObj.data.datasets[0].backgroundColor = [rgbv('amber', 500), rgbv('blue', 500), rgbv('purple', 500), rgbv('emerald', 500)]; chartTasksObj.update(); }
    } catch (e) {}
  }

  
  const $ = id => document.getElementById(id);
  const setv = (id, v) => { const e = $(id); if (e && document.activeElement !== e) e.value = v; };
  const CARD = 'bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4';
  const INP = 'p-1.5 text-xs font-mono rounded bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600';
  const PICK = 'w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-gray-300 dark:border-gray-600';
  const H3 = 'text-base font-bold text-gray-800 dark:text-white';
  const SUB = 'text-xs text-gray-500 dark:text-gray-400';
  const BTN = 'px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-semibold';

  function build() {
    $('nav-settings').insertAdjacentHTML('beforebegin',
      `<button onclick="switchTab('theme')" id="nav-theme" class="nav-item w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"><i class="fa-solid fa-palette w-5 text-center"></i><span>Theme Studio</span></button>`);

    const presets = Object.keys(P).map(n => {
      const b = { ...DEF.blend, ...(P[n].blend || {}) };
      return `<button onclick="Theme.preset('${n}')" class="rounded-xl border border-gray-200 dark:border-gray-700 p-2 text-xs font-semibold text-left text-gray-800 dark:text-gray-100 hover:border-blue-500"><div class="h-8 rounded-lg mb-2" style="background:linear-gradient(135deg,${b.from},${b.to})"></div>${n}</button>`;
    }).join('');

    const rows = FIELDS.map(([k, label, hint]) => `
      <div class="flex items-center gap-3">
        <input type="color" id="th-c-${k}" class="${PICK}" oninput="Theme.set('${k}',this.value)">
        <div class="flex-1 min-w-0">
          <p class="text-xs font-bold text-gray-800 dark:text-white">${label}</p>
          <p class="text-[11px] ${SUB}">${hint}</p>
          <div id="th-s-${k}" class="flex mt-1.5 rounded overflow-hidden h-2"></div>
        </div>
        <input type="text" id="th-h-${k}" maxlength="7" class="w-20 ${INP}" onchange="Theme.set('${k}',this.value)">
      </div>`).join('');

    const checks = [['logo', 'Logo & app name'], ['banner', 'Homework banner'], ['buttons', 'Main buttons'], ['page', 'Page background (soft tint)']]
      .map(([k, l]) => `<label class="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200"><input type="checkbox" id="th-b-${k}" onchange="Theme.blend('${k}',this.checked)" class="w-4 h-4 rounded"> ${l}</label>`).join('');

    const textRow = (id, key, label) => `
      <div class="flex items-center gap-3">
        <input type="color" id="${id}" class="${PICK}" oninput="Theme.text('${key}',this.value)">
        <div class="flex-1"><p class="text-xs font-bold text-gray-800 dark:text-white">${label}</p><p id="${id}-s" class="text-[11px] ${SUB}"></p></div>
        <button onclick="Theme.text('${key}','')" class="${BTN}">Auto</button>
      </div>`;

    document.querySelector('main').insertAdjacentHTML('beforeend', `
    <section id="view-theme" class="view-panel hidden space-y-6">
      <div class="max-w-4xl space-y-6">
        <div class="${CARD}">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div><h3 class="${H3}">Presets</h3><p class="${SUB}">Start from a look, then fine-tune every colour below. Saved in this browser.</p></div>
            <div class="flex gap-2">
              <button onclick="toggleDarkMode()" class="${BTN}"><i class="fa-solid fa-circle-half-stroke mr-1"></i>Light / Dark</button>
              <button onclick="Theme.reset()" class="${BTN}">Reset theme</button>
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">${presets}</div>
        </div>

        <div class="${CARD}">
          <div><h3 class="${H3}">Colours</h3><p class="${SUB}">Pick one colour per role. The strip shows the 11 shades the app generates from it.</p></div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">${rows}</div>
        </div>

        <div class="${CARD}">
          <div><h3 class="${H3}">Text colours</h3><p class="${SUB}">Leave on Auto to use the neutral tint.</p></div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            ${textRow('th-tl', 'textLight', 'Text in light mode')}
            ${textRow('th-td', 'textDark', 'Text in dark mode')}
          </div>
        </div>

        <div class="${CARD}">
          <div><h3 class="${H3}">Blend</h3><p class="${SUB}">A two-colour gradient you can spread across parts of the app.</p></div>
          <div id="th-prev" class="h-16 rounded-xl border border-gray-200 dark:border-gray-700"></div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div class="flex items-center gap-3"><input type="color" id="th-bf" class="${PICK}" oninput="Theme.blend('from',this.value)"><span class="text-xs font-semibold text-gray-800 dark:text-white">Start colour</span></div>
            <div class="flex items-center gap-3"><input type="color" id="th-bt" class="${PICK}" oninput="Theme.blend('to',this.value)"><span class="text-xs font-semibold text-gray-800 dark:text-white">End colour</span></div>
            <label class="text-xs text-gray-700 dark:text-gray-200">Angle: <b id="th-ba-v"></b>°<input type="range" id="th-ba" min="0" max="360" class="w-full" oninput="Theme.blend('angle',this.value)"></label>
            <label class="text-xs text-gray-700 dark:text-gray-200">Page tint strength: <b id="th-bs-v"></b>%<input type="range" id="th-bs" min="0" max="40" class="w-full" oninput="Theme.blend('strength',this.value)"></label>
          </div>
          <div class="flex flex-wrap gap-2">
            <button onclick="Theme.swap()" class="${BTN}"><i class="fa-solid fa-right-left mr-1"></i>Swap</button>
            <button onclick="Theme.useAccents()" class="${BTN}">Use accent colours</button>
          </div>
          <div class="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">${checks}</div>
        </div>
      </div>
    </section>`);
  }

  function sync() {
    FIELDS.forEach(([k]) => {
      const sh = shades(PAL[k], T.colors[k]);
      setv('th-c-' + k, T.colors[k]); setv('th-h-' + k, T.colors[k]);
      const s = $('th-s-' + k);
      if (s) s.innerHTML = SH.map(n => `<div class="flex-1" style="background:rgb(${sh[n]})"></div>`).join('');
    });
    const b = T.blend;
    setv('th-bf', b.from); setv('th-bt', b.to); setv('th-ba', b.angle); setv('th-bs', b.strength);
    if ($('th-ba-v')) { $('th-ba-v').textContent = b.angle; $('th-bs-v').textContent = b.strength; }
    ['logo', 'banner', 'buttons', 'page'].forEach(k => { const c = $('th-b-' + k); if (c) c.checked = !!b[k]; });
    const p = $('th-prev'); if (p) p.style.background = `linear-gradient(${b.angle}deg,${b.from},${b.to})`;
    setv('th-tl', T.textLight || '#1f2937'); setv('th-td', T.textDark || '#ffffff');
    if ($('th-tl-s')) { $('th-tl-s').textContent = T.textLight ? 'Custom' : 'Auto'; $('th-td-s').textContent = T.textDark ? 'Custom' : 'Auto'; }
  }

  function save() {
    try { localStorage.setItem('shixy_theme', JSON.stringify(T)); } catch (e) {}
    apply(); sync(); charts();
  }

  window.Theme = {
    set(k, v) { v = String(v).trim(); if (v[0] !== '#') v = '#' + v; if (/^#[0-9a-f]{6}$/i.test(v)) T.colors[k] = v.toLowerCase(); save(); },
    blend(k, v) { T.blend[k] = (k === 'angle' || k === 'strength') ? +v : v; save(); },
    text(k, v) { T[k] = v; save(); },
    preset(n) { const p = P[n] || {}; T = { colors: { ...DEF.colors, ...(p.colors || {}) }, textLight: '', textDark: '', blend: { ...DEF.blend, ...(p.blend || {}) } }; save(); },
    reset() { T = clone(DEF); save(); },
    swap() { [T.blend.from, T.blend.to] = [T.blend.to, T.blend.from]; save(); },
    useAccents() { T.blend.from = T.colors.accent; T.blend.to = T.colors.accent2; save(); }
  };

  document.addEventListener('DOMContentLoaded', () => {
    build(); sync();
    const st = window.switchTab;
    window.switchTab = function (t) { st(t); if (t === 'theme') $('page-title').textContent = 'Theme Studio'; };
    const uc = window.updateCharts;
    if (uc) window.updateCharts = function () { uc.apply(this, arguments); charts(); };
  });
})();
