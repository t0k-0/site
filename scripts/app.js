const ROOT = new URL('../', import.meta.url);
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const asset = (path) => new URL(path, ROOT).href;
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

const state = {
  lang: localStorage.getItem('tk-lang') || 'cs',
  theme: localStorage.getItem('tk-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day'),
};

function siteHeader() {
  const page = document.body.dataset.page || 'home';
  const links = [
    ['about', 'about/', 'O mně', 'About'],
    ['projects', 'projects/', 'Projekty', 'Projects'],
    ['articles', 'articles/', 'Články', 'Articles'],
    ['photography', 'photography/', 'Fotografie', 'Photography'],
    ['aviation', 'aviation/', 'Letectví', 'Aviation'],
    ['contact', 'contact/', 'Kontakt', 'Contact'],
  ];

  return `
    <a class="skip-link" href="#content" data-cs="Přejít k obsahu" data-en="Skip to content">Přejít k obsahu</a>
    <header class="site-header">
      <div class="shell nav-shell">
        <a class="brand" href="${ROOT.href}" aria-label="TK — domů">
          <img data-theme-logo src="${asset('assets/sitelogo_lightmode.svg')}" alt="" width="32" height="32">
          <span>TK <small>photo · air · code</small></span>
        </a>
        <nav class="main-nav" id="main-nav" aria-label="Hlavní navigace">
          ${links.map(([id, href, cs, en]) => `<a href="${new URL(href, ROOT).href}" data-cs="${cs}" data-en="${en}" ${page === id ? 'aria-current="page"' : ''}>${cs}</a>`).join('')}
        </nav>
        <div class="nav-tools">
          <button class="lang-button" type="button" data-lang-toggle aria-label="Switch language">EN</button>
          <button class="icon-button" type="button" data-theme-toggle aria-label="Přepnout barevný režim">◐</button>
          <button class="menu-button" type="button" aria-controls="main-nav" aria-expanded="false" aria-label="Otevřít menu">☰</button>
        </div>
      </div>
    </header>`;
}

function siteFooter() {
  return `
    <footer class="site-footer">
      <div class="shell footer-shell">
        <span>© ${new Date().getFullYear()} TK · <span data-cs="Fotografie, letectví a projekty" data-en="Photography, aviation & projects">Fotografie, letectví a projekty</span></span>
        <div class="footer-links">
          <a href="https://instagram.com/topinkasproductions" target="_blank" rel="noopener">Instagram ↗</a>
          <a href="${new URL('content-policy/', ROOT).href}" data-cs="Užití obsahu" data-en="Content use">Užití obsahu</a>
        </div>
      </div>
    </footer>`;
}

function applyChrome() {
  const header = $('[data-site-header]');
  const footer = $('[data-site-footer]');
  if (header) header.outerHTML = siteHeader();
  if (footer) footer.outerHTML = siteFooter();
}

function updateChromeLabels() {
  const english = state.lang === 'en';
  $('.brand')?.setAttribute('aria-label', english ? 'TK — home' : 'TK — domů');
  $('.main-nav')?.setAttribute('aria-label', english ? 'Main navigation' : 'Hlavní navigace');
  $('[data-lang-toggle]')?.setAttribute('aria-label', english ? 'Switch to Czech' : 'Přepnout do angličtiny');
  $('[data-theme-toggle]')?.setAttribute('aria-label', english ? 'Toggle colour theme' : 'Přepnout barevný režim');
  $('.menu-button')?.setAttribute('aria-label', document.body.classList.contains('menu-open')
    ? (english ? 'Close menu' : 'Zavřít menu')
    : (english ? 'Open menu' : 'Otevřít menu'));
}

function setTheme(theme) {
  state.theme = theme;
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('tk-theme', theme);
  $$('[data-theme-logo]').forEach((logo) => {
    logo.src = asset(theme === 'night' ? 'assets/sitelogo_darkmode.svg' : 'assets/sitelogo_lightmode.svg');
  });
  const button = $('[data-theme-toggle]');
  if (button) button.textContent = theme === 'night' ? '☀' : '◐';
  $('meta[name="theme-color"]')?.setAttribute('content', theme === 'night' ? '#0e100e' : '#f4efe5');
  updateChromeLabels();
  document.dispatchEvent(new CustomEvent('tk:theme', { detail: { theme } }));
}

function setLanguage(lang) {
  state.lang = lang;
  document.documentElement.lang = lang;
  localStorage.setItem('tk-lang', lang);
  $$('[data-cs][data-en]').forEach((element) => {
    element.textContent = element.dataset[lang];
  });
  $$('[data-alt-cs][data-alt-en]').forEach((element) => {
    element.alt = element.dataset[`alt${lang[0].toUpperCase()}${lang.slice(1)}`] || '';
  });
  $$('[data-aria-cs][data-aria-en]').forEach((element) => {
    element.setAttribute('aria-label', element.dataset[`aria${lang[0].toUpperCase()}${lang.slice(1)}`] || '');
  });
  const button = $('[data-lang-toggle]');
  if (button) button.textContent = lang === 'cs' ? 'EN' : 'CZ';
  updateChromeLabels();
  document.dispatchEvent(new CustomEvent('tk:language', { detail: { lang } }));
}

function initNavigation() {
  const menuButton = $('.menu-button');
  const setMenuOpen = (open) => {
    document.body.classList.toggle('menu-open', open);
    menuButton?.setAttribute('aria-expanded', String(open));
    if (menuButton) menuButton.textContent = open ? '×' : '☰';
    updateChromeLabels();
  };
  menuButton?.addEventListener('click', () => {
    setMenuOpen(!document.body.classList.contains('menu-open'));
  });
  $('.main-nav')?.addEventListener('click', () => setMenuOpen(false));
  addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('menu-open')) {
      setMenuOpen(false);
      menuButton?.focus();
    }
  });
  $('[data-lang-toggle]')?.addEventListener('click', () => setLanguage(state.lang === 'cs' ? 'en' : 'cs'));
  $('[data-theme-toggle]')?.addEventListener('click', () => setTheme(state.theme === 'night' ? 'day' : 'night'));
}

function initReveal() {
  const items = $$('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('in'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -4% 0px' });
  items.forEach((item) => observer.observe(item));
}

function initScrollProgress() {
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    document.body.style.setProperty('--scroll', max > 0 ? scrollY / max : 0);
  };
  addEventListener('scroll', update, { passive: true });
  update();
}

function initParallax() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layers = $$('[data-parallax]');
  if (!layers.length) return;
  let ticking = false;
  const update = () => {
    layers.forEach((layer) => {
      const rect = layer.getBoundingClientRect();
      const delta = (rect.top + rect.height / 2 - innerHeight / 2) / innerHeight;
      layer.style.translate = `0 ${Math.max(-18, Math.min(18, delta * -18))}px`;
    });
    ticking = false;
  };
  addEventListener('scroll', () => {
    if (!ticking) requestAnimationFrame(update);
    ticking = true;
  }, { passive: true });
  update();
}

function initSolarClock() {
  const byId = (id) => document.getElementById(id);
  const trigger = byId('hover-trigger');
  const control = $('.solar-clock');
  if (!trigger || !control) return;

  const suns = [byId('sun-day'), byId('sun-night-solid'), byId('sun-night-stroke')];
  const perimeterIdle = byId('earth-stroke-idle');
  const perimeterActive = byId('earth-stroke-active');
  const shadow = byId('fe-shadow');
  const innerOrbit = byId('inner-orbit');
  const hourHand = byId('hour-hand');
  const minuteHand = byId('minute-hand');
  const dropLine = byId('drop-line');
  const arc = byId('circumference-arc');
  const maskCircle = byId('inner-orbit-mask-circle');
  const circumference = 2 * Math.PI * 60;
  let morph = 0;
  let hovered = false;
  let focused = false;
  let pinned = false;
  let pointerInteraction = false;
  let animationFrame = 0;
  let previousFrame = 0;
  const latitude = 50.08;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const syncShadow = () => shadow.setAttribute('flood-color', state.theme === 'night' ? '#fff' : '#000');
  document.addEventListener('tk:theme', syncShadow);
  syncShadow();

  const coordinates = (degrees, radius) => {
    const radians = (degrees - 90) * Math.PI / 180;
    return { x: 300 + radius * Math.cos(radians), y: 200 + radius * Math.sin(radians) };
  };
  const ease = (value) => value < .5 ? 4 * value ** 3 : 1 - ((-2 * value + 2) ** 3) / 2;

  const updateSun = (date) => {
    const yearStart = new Date(date.getFullYear(), 0, 0);
    const day = Math.floor((date - yearStart) / 86400000);
    const declination = 23.45 * Math.sin(2 * Math.PI * (284 + day) / 365);
    const lat = latitude * Math.PI / 180;
    const dec = declination * Math.PI / 180;
    const cosine = Math.max(-1, Math.min(1, -Math.tan(lat) * Math.tan(dec)));
    const daylight = (Math.acos(cosine) * 180 / Math.PI / 15) * 60;
    const current = date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
    const sunrise = 720 - daylight;
    const sunset = 720 + daylight;
    const daytime = current >= sunrise && current <= sunset;
    let theta;
    if (daytime) theta = ((current - sunrise) / (sunset - sunrise)) * Math.PI;
    else {
      const progress = current > sunset
        ? (current - sunset) / (1440 - (sunset - sunrise))
        : (current + 1440 - sunset) / (1440 - (sunset - sunrise));
      theta = Math.PI + progress * Math.PI;
    }
    const x = 300 - 200 * Math.cos(theta);
    suns.forEach((sun) => sun.setAttribute('cx', x));
    suns[0].style.display = daytime ? 'block' : 'none';
  };

  const renderClock = (now) => {
    const first = Math.min(1, morph / .2);
    const second = Math.max(0, Math.min(1, (morph - .2) / .3));
    const third = Math.max(0, Math.min(1, (morph - .58) / .42));

    perimeterIdle.style.opacity = morph > 0 ? 0 : 1;
    perimeterActive.style.opacity = morph > 0 ? 1 : 0;
    perimeterActive.setAttribute('stroke-width', morph > 0 ? 2 + 4 * first : 2);
    shadow.setAttribute('flood-opacity', .32 * morph);

    if (morph <= .2) {
      [dropLine, innerOrbit, hourHand, minuteHand, arc].forEach((item) => { item.style.opacity = 0; });
      maskCircle.setAttribute('stroke-dashoffset', circumference);
    } else if (morph <= .5) {
      dropLine.style.opacity = 1;
      dropLine.setAttribute('y2', 80 + 120 * second);
      [innerOrbit, hourHand, minuteHand, arc].forEach((item) => { item.style.opacity = 0; });
      maskCircle.setAttribute('stroke-dashoffset', circumference);
    } else if (morph <= .58) {
      dropLine.style.opacity = 1;
      dropLine.setAttribute('y2', 200);
      [innerOrbit, hourHand, minuteHand, arc].forEach((item) => { item.style.opacity = 0; });
      maskCircle.setAttribute('stroke-dashoffset', circumference);
    } else {
      dropLine.style.opacity = 0;
      [innerOrbit, hourHand, minuteHand, arc].forEach((item) => { item.style.opacity = 1; });
      const progress = ease(third);
      maskCircle.setAttribute('stroke-dashoffset', circumference * (1 - progress));
      const hours = (now.getHours() % 12) * 30 + now.getMinutes() * .5;
      const minutes = now.getMinutes() * 6 + now.getSeconds() * .1;
      const options = [{ h: hours, m: minutes }, { h: hours - 360, m: minutes - 360 }, { h: hours, m: minutes - 360 }, { h: hours - 360, m: minutes }];
      const safe = options.filter((option) => Math.abs(option.h - option.m) <= 180);
      const best = (safe.length ? safe : options).reduce((a, b) => Math.abs(b.h) + Math.abs(b.m) < Math.abs(a.h) + Math.abs(a.m) ? b : a);
      const hourTip = coordinates(best.h * progress, 60);
      const minuteBase = coordinates(best.m * progress, 60);
      const minuteTip = coordinates(best.m * progress, 120);
      hourHand.setAttribute('x2', hourTip.x); hourHand.setAttribute('y2', hourTip.y);
      minuteHand.setAttribute('x1', minuteBase.x); minuteHand.setAttribute('y1', minuteBase.y);
      minuteHand.setAttribute('x2', minuteTip.x); minuteHand.setAttribute('y2', minuteTip.y);
      arc.setAttribute('d', `M ${hourTip.x} ${hourTip.y} A 60 60 0 0 ${best.m - best.h >= 0 ? 1 : 0} ${minuteBase.x} ${minuteBase.y}`);
    }

    updateSun(now);
  };

  const animateMorph = (timestamp) => {
    const active = hovered || focused || pinned;
    const elapsed = previousFrame ? Math.min(timestamp - previousFrame, 32) : 16.667;
    previousFrame = timestamp;
    const step = elapsed / 833;
    morph = active ? Math.min(1, morph + step) : Math.max(0, morph - step);
    renderClock(new Date());
    if ((active && morph < 1) || (!active && morph > 0)) {
      animationFrame = requestAnimationFrame(animateMorph);
    } else {
      animationFrame = 0;
      previousFrame = 0;
    }
  };

  const updateInteraction = () => {
    const active = hovered || focused || pinned;
    control.setAttribute('aria-pressed', String(pinned));
    if (reducedMotion.matches) {
      morph = active ? 1 : 0;
      renderClock(new Date());
      return;
    }
    if (!animationFrame && ((active && morph < 1) || (!active && morph > 0))) {
      previousFrame = 0;
      animationFrame = requestAnimationFrame(animateMorph);
    }
  };

  control.addEventListener('mouseenter', () => { hovered = true; updateInteraction(); });
  control.addEventListener('mouseleave', () => { hovered = false; updateInteraction(); });
  control.addEventListener('pointerdown', () => { pointerInteraction = true; focused = false; });
  control.addEventListener('focus', () => { focused = !pointerInteraction; updateInteraction(); });
  control.addEventListener('blur', () => { focused = false; updateInteraction(); });
  control.addEventListener('click', () => { pinned = !pinned; pointerInteraction = false; updateInteraction(); });
  reducedMotion.addEventListener?.('change', updateInteraction);

  renderClock(new Date());
  setInterval(() => { renderClock(new Date()); }, 1000);
}

function initContact() {
  const form = $('#contact-form');
  if (!form) return;
  const status = $('#form-status');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = $('button[type="submit"]', form);
    button.disabled = true;
    status.textContent = state.lang === 'cs' ? 'Odesílám…' : 'Sending…';
    try {
      const response = await fetch('https://formspree.io/f/xojoqzla', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      form.reset();
      status.textContent = state.lang === 'cs' ? 'Děkuji — zpráva byla odeslána.' : 'Thank you — your message was sent.';
    } catch {
      status.innerHTML = state.lang === 'cs'
        ? 'Odeslání se nepodařilo. Napište prosím přímo na <a href="mailto:tk0@email.cz">tk0@email.cz</a>.'
        : 'Sending failed. Please write directly to <a href="mailto:tk0@email.cz">tk0@email.cz</a>.';
    } finally {
      button.disabled = false;
    }
  });
}

async function loadJson(path) {
  const response = await fetch(new URL(path, ROOT));
  if (!response.ok) throw new Error(`Unable to load ${path}`);
  return response.json();
}

async function loadText(path) {
  const response = await fetch(new URL(path, ROOT));
  if (!response.ok) throw new Error(`Unable to load ${path}`);
  return response.text();
}

function localized(value) {
  if (typeof value === 'string') return value;
  return value?.[state.lang] || value?.cs || value?.en || '';
}

async function initHeroGallery() {
  const collage = $('[data-hero-gallery]');
  if (!collage) return;
  if (matchMedia('(max-width: 720px)').matches) {
    collage.classList.add('hero-collage--mobile');
    return;
  }

  try {
    const manifest = await loadJson('data/gallery.json');
    const availableSeries = manifest.series.filter((series) => series.photos?.length);
    const shuffledSeries = [...availableSeries].sort(() => Math.random() - .5);
    const picks = shuffledSeries.slice(0, 4).map((series) => ({
      series,
      photo: series.photos[Math.floor(Math.random() * series.photos.length)],
    }));
    const layout = ['layout-a', 'layout-b', 'layout-c'][Math.floor(Math.random() * 3)];
    collage.classList.add(layout);

    const photographyUrl = new URL('photography/', ROOT);
    const frames = picks.map(({ series, photo }, index) => `
      <a class="hero-frame hero-frame--${index + 1} reveal" href="${photographyUrl.href}?series=${encodeURIComponent(series.id)}">
        <img src="${asset(photo.thumb || photo.src)}" alt="${escapeHtml(localized(photo.alt) || '')}" data-alt-cs="${escapeHtml(photo.alt?.cs || '')}" data-alt-en="${escapeHtml(photo.alt?.en || '')}" loading="eager" decoding="async" ${index === 0 ? 'fetchpriority="high"' : ''}>
        <span class="hero-photo-label" data-cs="${String(index + 1).padStart(2, '0')} / ${escapeHtml(series.name?.cs || series.name)}" data-en="${String(index + 1).padStart(2, '0')} / ${escapeHtml(series.name?.en || series.name)}">${String(index + 1).padStart(2, '0')} / ${escapeHtml(localized(series.name))}</span>
      </a>`).join('');
    collage.insertAdjacentHTML('afterbegin', frames);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      $$('.hero-frame', collage).forEach((frame) => frame.classList.add('in'));
    }));
  } catch {
    collage.classList.add('hero-collage--empty');
  }
}

function initTransitDisplay() {
  const message = $('[data-transit-message]');
  if (!message) return;
  const matrixFont = {
    A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
    D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
    G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
    H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
    K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
    L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
    M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
    N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
    O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
    Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
    R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
    V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
    W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
    X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
    Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
    Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
    0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
    1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
    2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
    3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
    4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
    5: ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
    6: ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
    7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
    8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
    9: ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
    '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
    '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
    '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
  };
  const messages = {
    cs: [
      '01 FOTOGRAFIE',
      '02 LETECTVI',
      '03 PROJEKTY',
      '04 KOLIN / CZ',
    ],
    en: [
      '01 PHOTOGRAPHY',
      '02 AVIATION',
      '03 PROJECTS',
      '04 KOLIN / CZ',
    ],
  };
  let index = Math.floor(Math.random() * messages[state.lang].length);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let boardColumns = 0;
  let boardRows = 7;
  let textRowOffset = 0;
  let bitmap = [];
  let lastOffset;
  let movementFrame;
  let dwellTimer;
  let offset = 0;
  let context;
  let boardBackground;
  let ledSprites = [];
  let panelWidth = 0;
  let panelHeight = 0;
  let pixelRatio = 1;
  let dotSize = 3;
  let dotPitch = 4.5;
  let originX = 0;
  let originY = 0;

  const createBitmap = (value) => {
    const columns = [];
    [...value.toUpperCase()].forEach((character) => {
      if (character === ' ') {
        columns.push([0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]);
        return;
      }
      const rows = matrixFont[character] || matrixFont['?'];
      for (let column = 0; column < 5; column += 1) {
        columns.push(rows.map((row) => Number(row[column])));
      }
      columns.push([0, 0, 0, 0, 0, 0, 0]);
    });
    return columns;
  };

  const setCurrentMessage = () => {
    const currentMessage = messages[state.lang][index % messages[state.lang].length];
    bitmap = createBitmap(currentMessage);
    message.setAttribute('aria-label', currentMessage);
    lastOffset = undefined;
  };

  const buildBoard = () => {
    const bounds = message.getBoundingClientRect();
    panelWidth = Math.max(1, Math.round(bounds.width));
    panelHeight = Math.max(1, Math.round(bounds.height));
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    message.width = Math.round(panelWidth * pixelRatio);
    message.height = Math.round(panelHeight * pixelRatio);
    context = message.getContext('2d', { alpha: true });

    dotSize = Math.max(2.8, Math.min(4.8, panelWidth * .003));
    const gap = Math.max(1.2, Math.min(1.8, panelWidth * .0011));
    dotPitch = dotSize + gap;
    boardColumns = Math.max(24, Math.floor((panelWidth + gap) / dotPitch));
    boardRows = Math.max(7, Math.floor((panelHeight + gap) / dotPitch));
    if (boardRows % 2 === 0) boardRows -= 1;
    textRowOffset = Math.floor((boardRows - 7) / 2);
    const usedWidth = boardColumns * dotPitch - gap;
    const usedHeight = boardRows * dotPitch - gap;
    originX = (panelWidth - usedWidth) / 2 + dotSize / 2;
    originY = (panelHeight - usedHeight) / 2 + dotSize / 2;

    boardBackground = document.createElement('canvas');
    boardBackground.width = message.width;
    boardBackground.height = message.height;
    const backgroundContext = boardBackground.getContext('2d');
    backgroundContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    backgroundContext.fillStyle = '#1a1209';
    backgroundContext.strokeStyle = 'rgba(255, 171, 45, .05)';
    backgroundContext.lineWidth = .65;
    backgroundContext.beginPath();
    for (let row = 0; row < boardRows; row += 1) {
      for (let column = 0; column < boardColumns; column += 1) {
        const x = originX + column * dotPitch;
        const y = originY + row * dotPitch;
        backgroundContext.moveTo(x + dotSize / 2, y);
        backgroundContext.arc(x, y, dotSize / 2, 0, Math.PI * 2);
      }
    }
    backgroundContext.fill();
    backgroundContext.stroke();

    const createLedSprite = (core, halo) => {
      const spriteSize = dotSize + 10;
      const sprite = document.createElement('canvas');
      sprite.width = Math.ceil(spriteSize * pixelRatio);
      sprite.height = Math.ceil(spriteSize * pixelRatio);
      const spriteContext = sprite.getContext('2d');
      spriteContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      const center = spriteSize / 2;
      const glow = spriteContext.createRadialGradient(center, center, dotSize * .15, center, center, center);
      glow.addColorStop(0, halo);
      glow.addColorStop(.42, 'rgba(255, 151, 24, .32)');
      glow.addColorStop(1, 'transparent');
      spriteContext.fillStyle = glow;
      spriteContext.fillRect(0, 0, spriteSize, spriteSize);
      spriteContext.fillStyle = core;
      spriteContext.beginPath();
      spriteContext.arc(center, center, dotSize / 2, 0, Math.PI * 2);
      spriteContext.fill();
      return { canvas: sprite, size: spriteSize };
    };
    ledSprites = [
      createLedSprite('#ffc044', 'rgba(255, 177, 39, .72)'),
      createLedSprite('#ffad24', 'rgba(255, 151, 20, .66)'),
      createLedSprite('#ffd064', 'rgba(255, 198, 79, .76)'),
    ];
    lastOffset = undefined;
  };

  const renderAt = (offset) => {
    if (offset === lastOffset || !context || !boardBackground) return;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, message.width, message.height);
    context.drawImage(boardBackground, 0, 0);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    bitmap.forEach((column, bitmapColumn) => {
      const boardColumn = offset + bitmapColumn;
      if (boardColumn < 0 || boardColumn >= boardColumns) return;
      column.forEach((active, row) => {
        if (!active) return;
        const physicalRow = textRowOffset + row;
        const cellIndex = physicalRow * boardColumns + boardColumn;
        const variant = cellIndex % 5 === 0 ? 2 : cellIndex % 3 === 0 ? 1 : 0;
        const sprite = ledSprites[variant];
        const x = originX + boardColumn * dotPitch;
        const y = originY + physicalRow * dotPitch;
        context.drawImage(sprite.canvas, x - sprite.size / 2, y - sprite.size / 2, sprite.size, sprite.size);
      });
    });
    lastOffset = offset;
  };

  const renderStatic = () => renderAt(Math.max(1, Math.floor((boardColumns - bitmap.length) / 2)));
  const dwellDuration = 3900;
  // The lamps still advance by exactly one physical column. Paint-aligned
  // stepping avoids timer jitter, and deliberately never catches up after a
  // dropped frame (which would look like a momentary burst of acceleration).
  const moveStepDuration = 10;

  const clearBoardTimers = () => {
    cancelAnimationFrame(movementFrame);
    clearTimeout(dwellTimer);
  };

  const moveTo = (destination, onArrival) => {
    let lastStepAt = 0;
    const move = (timestamp) => {
      if (lastStepAt && timestamp - lastStepAt < moveStepDuration) {
        movementFrame = requestAnimationFrame(move);
        return;
      }
      lastStepAt = timestamp;
      offset -= 1;
      renderAt(offset);
      if (offset === destination) {
        onArrival();
        return;
      }
      movementFrame = requestAnimationFrame(move);
    };
    movementFrame = requestAnimationFrame(move);
  };

  const beginExit = () => {
    const restingOffset = Math.max(1, Math.floor((boardColumns - bitmap.length) / 2));
    offset = restingOffset;
    moveTo(-bitmap.length, () => {
      index = (index + 1) % messages[state.lang].length;
      setCurrentMessage();
      beginEntry();
    });
  };

  const beginEntry = () => {
    offset = boardColumns;
    renderAt(offset);
    const restingOffset = Math.max(1, Math.floor((boardColumns - bitmap.length) / 2));
    moveTo(restingOffset, () => {
      dwellTimer = setTimeout(beginExit, dwellDuration);
    });
  };

  const restart = () => {
    clearBoardTimers();
    buildBoard();
    setCurrentMessage();
    if (reducedMotion.matches) renderStatic();
    else beginEntry();
  };

  document.addEventListener('tk:language', () => {
    index = 0;
    restart();
  });
  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(restart, 160);
  }, { passive: true });
  restart();
}

async function initProjects() {
  const list = $('#project-list');
  if (!list) return;
  try {
    const data = await loadJson('data/projects.json');
    const params = new URLSearchParams(location.search);
    const selected = params.get('id');

    const renderList = () => {
      $('#projects-overview').hidden = false;
      $('#project-detail').classList.remove('active');
      list.innerHTML = data.projects.map((project, index) => `
        <a class="project-card reveal in" href="?id=${encodeURIComponent(project.id)}">
          <span class="project-card-image">
            <img src="${asset(project.images?.[0] || '')}" alt="${escapeHtml(localized(project.title))}" loading="${index < 3 ? 'eager' : 'lazy'}" decoding="async">
            <span class="project-card-index">${String(index + 1).padStart(2, '0')}</span>
          </span>
          <span class="project-card-info">
            <small>${escapeHtml(localized(project.category))}</small>
            <strong>${escapeHtml(localized(project.title))}</strong>
            <span>${escapeHtml(localized(project.summary))}</span>
            <span class="project-card-foot"><span>${state.lang === 'cs' ? 'Detail projektu' : 'Project details'} →</span><time>${project.year}</time></span>
          </span>
        </a>`).join('');
    };

    const renderDetail = (project) => {
      $('#projects-overview').hidden = true;
      const detail = $('#project-detail');
      detail.classList.add('active');
      const images = project.images || [];
      detail.innerHTML = `
        <nav class="project-detail-nav">
          <a class="project-back" href="${new URL('projects/', ROOT).href}">← ${state.lang === 'cs' ? 'Zpět na projekty' : 'Back to projects'}</a>
          <span>02 / ${escapeHtml(localized(project.title))}</span>
        </nav>
        <div class="project-product">
          <div class="project-viewer">
            ${images[0] ? `
              <div class="project-main-wrap">
                <button class="project-image-nav prev" type="button" data-project-nav="-1" aria-label="${state.lang === 'cs' ? 'Předchozí obrázek' : 'Previous image'}" ${images.length < 2 ? 'hidden' : ''}>←</button>
                <img class="project-main-image" id="project-main-image" src="${asset(images[0])}" alt="${escapeHtml(localized(project.title))}" fetchpriority="high">
                <button class="project-image-nav next" type="button" data-project-nav="1" aria-label="${state.lang === 'cs' ? 'Další obrázek' : 'Next image'}" ${images.length < 2 ? 'hidden' : ''}>→</button>
                <span class="project-image-count" id="project-image-count">1 / ${images.length}</span>
              </div>
              <div class="project-thumbs" aria-label="${state.lang === 'cs' ? 'Náhledy projektu' : 'Project thumbnails'}">
                ${images.map((image, index) => `<button class="project-thumb ${index === 0 ? 'active' : ''}" type="button" data-project-image="${index}" aria-label="${index + 1} / ${images.length}"><img src="${asset(image)}" alt="" loading="${index < 6 ? 'eager' : 'lazy'}"></button>`).join('')}
              </div>` : ''}
          </div>
          <div class="project-product-info">
            <p class="project-tag">${escapeHtml(localized(project.category))}</p>
            <h1>${escapeHtml(localized(project.title))}</h1>
            <p class="project-summary">${escapeHtml(localized(project.summary))}</p>
            ${project.link && project.link !== '#' ? `<a class="button project-cta" href="${asset(project.link)}" ${project.external ? 'target="_blank" rel="noopener"' : ''}>${project.type === 'download' ? (state.lang === 'cs' ? 'Stáhnout' : 'Download') : (state.lang === 'cs' ? 'Otevřít projekt' : 'Open project')} ↗</a>` : ''}
            <div class="project-meta">
              <div><span>${state.lang === 'cs' ? 'Rok' : 'Year'}</span><strong>${project.year}</strong></div>
              <div><span>${state.lang === 'cs' ? 'Kategorie' : 'Category'}</span><strong>${escapeHtml(localized(project.category))}</strong></div>
              <div><span>${state.lang === 'cs' ? 'Formát' : 'Format'}</span><strong>${project.type === 'download' ? 'Download' : 'Web'}</strong></div>
            </div>
          </div>
        </div>
        <section class="project-description">
          <p class="project-description-label">${state.lang === 'cs' ? 'O projektu' : 'About the project'}</p>
          <div class="prose">${localized(project.description).split('\n').filter(Boolean).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</div>
        </section>`;

      let activeImage = 0;
      const selectImage = (nextIndex) => {
        if (!images.length) return;
        activeImage = (nextIndex + images.length) % images.length;
        $('#project-main-image', detail).src = asset(images[activeImage]);
        $('#project-image-count', detail).textContent = `${activeImage + 1} / ${images.length}`;
        $$('[data-project-image]', detail).forEach((thumb, index) => thumb.classList.toggle('active', index === activeImage));
      };
      detail.addEventListener('click', (event) => {
        const thumb = event.target.closest('[data-project-image]');
        const direction = event.target.closest('[data-project-nav]');
        if (thumb) selectImage(Number(thumb.dataset.projectImage));
        if (direction) selectImage(activeImage + Number(direction.dataset.projectNav));
      });
      setLanguage(state.lang);
    };

    const project = data.projects.find((item) => item.id === selected);
    project ? renderDetail(project) : renderList();
    document.addEventListener('tk:language', () => location.reload(), { once: true });
  } catch (error) {
    list.innerHTML = `<p>${error.message}</p>`;
  }
}

async function initGallery() {
  const seriesGrid = $('#series-grid');
  if (!seriesGrid) return;
  const galleryView = $('#gallery-view');
  const overview = $('#gallery-overview');
  const galleryGrid = $('#gallery-grid');
  const dialog = $('#lightbox');
  let manifest;
  let currentSeries;
  let currentIndex = 0;

  try {
    manifest = await loadJson('data/gallery.json');
  } catch (error) {
    seriesGrid.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  const openSeries = (id, push = true) => {
    currentSeries = manifest.series.find((series) => series.id === id);
    if (!currentSeries) return;
    overview.hidden = true;
    galleryView.classList.add('active');
    $('#gallery-title').textContent = localized(currentSeries.name);
    galleryGrid.innerHTML = currentSeries.photos.map((photo, index) => `
      <button class="gallery-item reveal" type="button" data-photo="${index}" aria-label="${escapeHtml(localized(photo.alt) || localized(currentSeries.name))}">
        <img src="${asset(photo.thumb || photo.src)}" alt="${escapeHtml(localized(photo.alt) || '')}" loading="lazy" decoding="async">
      </button>`).join('');
    initReveal();
    scrollTo({ top: 0, behavior: 'instant' });
    if (push) history.pushState({ series: id }, '', `?series=${encodeURIComponent(id)}`);
  };

  const closeSeries = (push = true) => {
    overview.hidden = false;
    galleryView.classList.remove('active');
    currentSeries = null;
    if (push) history.pushState({}, '', location.pathname);
  };

  const renderSeries = () => {
    seriesGrid.innerHTML = manifest.series.map((series, seriesIndex) => {
      const selected = series.photos.filter((photo) => photo.preview);
      const previews = (selected.length ? selected : series.photos.slice(0, 10));
      return `
        <article class="film-series reveal">
          <header class="film-series-header">
            <span class="film-series-index">${String(seriesIndex + 1).padStart(2, '0')}</span>
            <div>
              <small class="film-series-code">TK–S${String(seriesIndex + 1).padStart(2, '0')} / ${escapeHtml(series.id)}</small>
              <h2>${escapeHtml(localized(series.name))}</h2>
            </div>
            <p>${escapeHtml(localized(series.description))}</p>
            <button class="button ghost film-series-open" type="button" data-series="${escapeHtml(series.id)}">${series.photos.length} ${state.lang === 'cs' ? 'snímků' : 'frames'} ↗</button>
          </header>
          <div class="film-strip">
            <div class="film-rail" id="film-${escapeHtml(series.id)}" tabindex="0" aria-label="${escapeHtml(localized(series.name))} — ${state.lang === 'cs' ? 'tažením posunete film' : 'drag to move the film'}">
              <div class="film-track">
                <span class="film-stock-mark" aria-hidden="true">TK COLOR · S${String(seriesIndex + 1).padStart(2, '0')} · ${new Date().getFullYear()}</span>
                ${previews.map((photo, photoIndex) => `
                  <button class="film-frame" type="button" data-series="${escapeHtml(series.id)}" aria-label="${escapeHtml(localized(photo.alt) || localized(series.name))}">
                    <img src="${asset(photo.thumb || photo.src)}" alt="${escapeHtml(localized(photo.alt) || '')}" loading="${seriesIndex === 0 && photoIndex < 4 ? 'eager' : 'lazy'}" decoding="async" draggable="false">
                    <span>${String(photoIndex + 1).padStart(2, '0')}A</span>
                  </button>`).join('')}
                <span class="film-end-mark" aria-hidden="true">EXPOSED BY TK · ${String(previews.length).padStart(2, '0')} FRAMES</span>
              </div>
            </div>
            <div class="film-controls">
              <button type="button" data-film-scroll="-1" data-film-target="film-${escapeHtml(series.id)}" aria-label="${state.lang === 'cs' ? 'Posunout doleva' : 'Scroll left'}">←</button>
              <button type="button" data-film-scroll="1" data-film-target="film-${escapeHtml(series.id)}" aria-label="${state.lang === 'cs' ? 'Posunout doprava' : 'Scroll right'}">→</button>
            </div>
          </div>
        </article>`;
    }).join('');
    initFilmMotion();
    initReveal();
  };

  const initFilmMotion = () => {
    $$('.film-rail', seriesGrid).forEach((rail) => {
      let pointerId;
      let originX = 0;
      let previousX = 0;
      let previousTime = 0;
      let velocity = 0;
      let moved = false;
      let suppressClick = false;
      let inertiaFrame;
      let settleTimer;

      const setMotion = (speed = 0) => {
        rail.classList.add('moving');
        const tilt = Math.max(-.18, Math.min(.18, speed * .045));
        rail.style.setProperty('--film-tilt', `${tilt}deg`);
        clearTimeout(settleTimer);
        settleTimer = setTimeout(() => {
          rail.classList.remove('moving');
          rail.style.setProperty('--film-tilt', '0deg');
        }, 160);
      };

      const release = () => {
        if (pointerId === undefined) return;
        const activePointer = pointerId;
        pointerId = undefined;
        try { rail.releasePointerCapture(activePointer); } catch {}
        rail.classList.remove('dragging');
        suppressClick = moved;
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        cancelAnimationFrame(inertiaFrame);
        const glide = () => {
          if (Math.abs(velocity) < .015) {
            setMotion(0);
            return;
          }
          const before = rail.scrollLeft;
          rail.scrollLeft -= velocity * 16;
          if (rail.scrollLeft === before) velocity = 0;
          else velocity *= .935;
          setMotion(velocity);
          inertiaFrame = requestAnimationFrame(glide);
        };
        inertiaFrame = requestAnimationFrame(glide);
      };

      rail.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        cancelAnimationFrame(inertiaFrame);
        pointerId = event.pointerId;
        originX = previousX = event.clientX;
        previousTime = performance.now();
        velocity = 0;
        moved = false;
        rail.setPointerCapture(pointerId);
        rail.classList.add('dragging');
      });
      rail.addEventListener('pointermove', (event) => {
        if (event.pointerId !== pointerId) return;
        const now = performance.now();
        const delta = event.clientX - previousX;
        rail.scrollLeft -= delta;
        velocity = delta / Math.max(1, now - previousTime);
        moved ||= Math.abs(event.clientX - originX) > 5;
        previousX = event.clientX;
        previousTime = now;
        setMotion(velocity);
      });
      rail.addEventListener('pointerup', release);
      rail.addEventListener('pointercancel', release);
      rail.addEventListener('lostpointercapture', release);
      rail.addEventListener('click', (event) => {
        if (!suppressClick) return;
        event.preventDefault();
        event.stopPropagation();
        suppressClick = false;
      }, true);
      rail.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        rail.scrollBy({ left: (event.key === 'ArrowRight' ? 1 : -1) * rail.clientWidth * .65, behavior: 'smooth' });
      });
      rail.addEventListener('scroll', () => setMotion(velocity), { passive: true });
    });
  };

  const showPhoto = (index) => {
    if (!currentSeries) return;
    currentIndex = (index + currentSeries.photos.length) % currentSeries.photos.length;
    const photo = currentSeries.photos[currentIndex];
    $('#lightbox-image').src = asset(photo.src);
    $('#lightbox-image').alt = localized(photo.alt) || '';
    $('#lightbox-count').textContent = `${currentIndex + 1} / ${currentSeries.photos.length}`;
  };

  seriesGrid.addEventListener('click', (event) => {
    const scrollButton = event.target.closest('[data-film-scroll]');
    if (scrollButton) {
      const rail = document.getElementById(scrollButton.dataset.filmTarget);
      rail?.scrollBy({ left: Number(scrollButton.dataset.filmScroll) * Math.min(rail.clientWidth * .78, 720), behavior: 'smooth' });
      return;
    }
    const card = event.target.closest('[data-series]');
    if (card) openSeries(card.dataset.series);
  });
  $('#gallery-back').addEventListener('click', () => closeSeries());
  galleryGrid.addEventListener('click', (event) => {
    const item = event.target.closest('[data-photo]');
    if (!item) return;
    showPhoto(Number(item.dataset.photo));
    dialog.showModal();
  });
  $('#lightbox-close').addEventListener('click', () => dialog.close());
  $('#lightbox-prev').addEventListener('click', () => showPhoto(currentIndex - 1));
  $('#lightbox-next').addEventListener('click', () => showPhoto(currentIndex + 1));
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  addEventListener('keydown', (event) => {
    if (!dialog.open) return;
    if (event.key === 'ArrowLeft') showPhoto(currentIndex - 1);
    if (event.key === 'ArrowRight') showPhoto(currentIndex + 1);
  });
  addEventListener('popstate', () => {
    const id = new URLSearchParams(location.search).get('series');
    id ? openSeries(id, false) : closeSeries(false);
  });
  document.addEventListener('tk:language', () => {
    renderSeries();
    if (currentSeries) openSeries(currentSeries.id, false);
  });

  renderSeries();
  const initialSeries = new URLSearchParams(location.search).get('series');
  if (initialSeries) openSeries(initialSeries, false);
}

async function initArticles() {
  const list = $('#article-list');
  if (!list) return;
  const { renderMarkdown } = await import('./markdown.js');
  const overview = $('#articles-overview');
  const detail = $('#article-detail');
  const dialog = $('#article-lightbox');
  let manifest;

  try {
    manifest = await loadJson('data/articles.json');
  } catch (error) {
    list.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
    return;
  }

  const published = (manifest.articles || [])
    .filter((article) => article.status === 'published')
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const formatDate = (date) => new Intl.DateTimeFormat(state.lang === 'cs' ? 'cs-CZ' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
  const articleUrl = (id) => `${new URL('articles/', ROOT).href}?id=${encodeURIComponent(id)}`;

  const renderList = () => {
    overview.hidden = false;
    detail.classList.remove('active');
    document.title = state.lang === 'cs' ? 'Články — TK' : 'Articles — TK';
    $('link[rel="canonical"]')?.setAttribute('href', new URL('articles/', ROOT).href);
    if (!published.length) {
      list.innerHTML = `<div class="article-empty"><p class="eyebrow">TK / NOTES</p><p>${state.lang === 'cs' ? 'První článek se právě připravuje.' : 'The first article is being prepared.'}</p></div>`;
      return;
    }
    list.innerHTML = published.map((article, index) => `
      <a class="article-card reveal in" href="${articleUrl(article.id)}">
        ${article.cover ? `<span class="article-card-image"><img src="${asset(article.cover)}" alt="" loading="${index < 2 ? 'eager' : 'lazy'}" decoding="async"></span>` : '<span class="article-card-image article-card-image--empty" aria-hidden="true">TK</span>'}
        <span class="article-card-copy">
          <span class="article-meta"><time datetime="${escapeHtml(article.date)}">${formatDate(article.date)}</time><span>${escapeHtml((article.tags || []).slice(0, 2).join(' · '))}</span></span>
          <strong>${escapeHtml(localized(article.title))}</strong>
          <span>${escapeHtml(localized(article.summary))}</span>
          <small>${state.lang === 'cs' ? 'Číst článek' : 'Read article'} →</small>
        </span>
      </a>`).join('');
  };

  const renderDetail = async (article) => {
    overview.hidden = true;
    detail.classList.add('active');
    const requestedBody = article.body?.[state.lang] || article.body?.cs || article.body?.en;
    if (!requestedBody) throw new Error(state.lang === 'cs' ? 'Článek nemá text.' : 'This article has no body.');
    const markdown = await loadText(requestedBody);
    const words = markdown.replace(/^---[\s\S]*?---/, '').trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / (state.lang === 'cs' ? 190 : 220)));
    const title = localized(article.title);
    const summary = localized(article.summary);
    document.title = `${title} — TK`;
    $('meta[name="description"]')?.setAttribute('content', summary);
    $('link[rel="canonical"]')?.setAttribute('href', articleUrl(article.id));
    $('meta[property="og:type"]')?.setAttribute('content', 'article');
    $('meta[property="og:title"]')?.setAttribute('content', title);
    $('meta[property="og:description"]')?.setAttribute('content', summary);
    $('meta[property="og:url"]')?.setAttribute('content', articleUrl(article.id));
    if (article.cover) $('meta[property="og:image"]')?.setAttribute('content', asset(article.cover));
    detail.innerHTML = `
      <nav class="article-detail-nav">
        <a class="project-back" href="${new URL('articles/', ROOT).href}">← ${state.lang === 'cs' ? 'Zpět na články' : 'Back to articles'}</a>
        <button class="button ghost" type="button" data-copy-article>${state.lang === 'cs' ? 'Kopírovat odkaz' : 'Copy link'}</button>
      </nav>
      <header class="article-header">
        <p class="eyebrow">TK / ${escapeHtml((article.tags || [state.lang === 'cs' ? 'Článek' : 'Article'])[0])}</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="article-deck">${escapeHtml(summary)}</p>
        <p class="article-byline"><span>${escapeHtml(article.author || 'TK')}</span><time datetime="${escapeHtml(article.date)}">${formatDate(article.date)}</time><span>${minutes} min</span></p>
      </header>
      ${article.cover ? `<figure class="article-cover"><img src="${asset(article.cover)}" alt="${escapeHtml(title)}" fetchpriority="high"></figure>` : ''}
      <div class="article-body">${renderMarkdown(markdown, { lang: state.lang, resolveAsset: (path) => asset(path) })}</div>
      <footer class="article-end"><span>TK / ${new Date(article.date).getUTCFullYear()}</span><a href="${new URL('articles/', ROOT).href}">${state.lang === 'cs' ? 'Další články' : 'More articles'} →</a></footer>`;

    $$('[data-article-gallery] img, .article-image img', detail).forEach((image) => {
      image.tabIndex = 0;
      image.setAttribute('role', 'button');
      image.setAttribute('aria-label', state.lang === 'cs' ? 'Zvětšit fotografii' : 'Enlarge photograph');
    });
  };

  detail.addEventListener('click', async (event) => {
    const copy = event.target.closest('[data-copy-article]');
    if (copy) {
      await navigator.clipboard?.writeText(location.href);
      copy.textContent = state.lang === 'cs' ? 'Odkaz zkopírován ✓' : 'Link copied ✓';
      return;
    }
    const image = event.target.closest('.article-body img');
    if (!image) return;
    $('#article-lightbox-image').src = image.src;
    $('#article-lightbox-image').alt = image.alt;
    $('#article-lightbox-caption').textContent = image.dataset.caption || image.alt || '';
    dialog.showModal();
  });
  detail.addEventListener('keydown', (event) => {
    if (!['Enter', ' '].includes(event.key) || !event.target.matches('.article-body img')) return;
    event.preventDefault(); event.target.click();
  });
  $('#article-lightbox-close')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });

  const selected = new URLSearchParams(location.search).get('id');
  const article = published.find((item) => item.id === selected);
  if (selected && !article) {
    list.innerHTML = `<p>${state.lang === 'cs' ? 'Článek nebyl nalezen.' : 'Article not found.'}</p>`;
    history.replaceState({}, '', location.pathname);
    renderList();
  } else if (article) {
    try { await renderDetail(article); } catch (error) { detail.innerHTML = `<p>${escapeHtml(error.message)}</p>`; }
  } else renderList();

  document.addEventListener('tk:language', async () => {
    if (article) await renderDetail(article);
    else renderList();
  });
}

applyChrome();
setTheme(state.theme);
setLanguage(state.lang);
initNavigation();
initReveal();
initScrollProgress();
initParallax();
initSolarClock();
initHeroGallery();
initTransitDisplay();
initContact();
initProjects();
initGallery();
initArticles();

export { ROOT, asset, loadJson, loadText, localized, state };
