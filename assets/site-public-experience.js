/* Les In10pensables — couche d'expérience du site public.
   Micro-interactions uniquement : aucune donnée, aucun formulaire, aucune
   navigation n'est modifié. Les décors injectés sont aria-hidden et ne
   reçoivent jamais le focus. Sans ce script, le site reste complet. */
(() => {
  'use strict';

  const root = document.documentElement;
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  const mqHover = matchMedia('(hover: hover) and (pointer: fine)');
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const motion = () => !mqReduce.matches;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const safe = fn => { try { fn(); } catch (e) { /* un décor ne doit jamais casser le site */ } };

  if (motion()) root.classList.add('fx');
  if (mqHover.matches) root.classList.add('fx-hover');

  /* ------------------------------------------------------------------ */
  /* Fabrique de nœuds                                                    */
  /* ------------------------------------------------------------------ */
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(k => n.setAttribute(k, attrs[k]));
    if (parent) parent.appendChild(n);
    return n;
  };
  const div = (cls, parent, tag) => {
    const n = document.createElement(tag || 'div');
    n.className = cls;
    n.setAttribute('aria-hidden', 'true');
    if (parent) parent.appendChild(n);
    return n;
  };

  /* Constellations : points et arêtes fixes, donc toujours identiques. */
  const MESHES = {
    hero: {
      vb: [900, 520],
      pts: [[60,120],[190,70],[330,150],[250,270],[110,300],[420,60],[520,180],[470,330],[360,400],[640,90],[730,230],[640,360],[790,60],[850,170],[820,330],[700,450],[540,470],[230,430]],
      edges: [[0,1],[1,2],[2,3],[3,4],[4,0],[1,5],[5,2],[5,9],[2,6],[5,6],[6,9],[6,7],[7,3],[7,8],[8,3],[9,12],[9,10],[10,6],[10,13],[12,13],[10,11],[11,7],[11,14],[10,14],[14,13],[11,15],[15,14],[11,16],[16,7],[16,15],[8,17],[17,16],[17,4]],
      halos: [2,6,10,7],
      signals: [
        { d: 'M190 70 L420 60 L640 90 L790 60', dur: 12, begin: 3.5 },
        { d: 'M110 300 L250 270 L470 330 L640 360 L820 330', dur: 15, begin: 8 }
      ]
    },
    dark: {
      vb: [760, 320],
      pts: [[40,210],[150,80],[270,170],[390,60],[490,210],[600,100],[700,235],[310,285],[580,290]],
      edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[2,7],[4,8],[7,8],[6,8],[1,3],[5,8]],
      halos: [3,5],
      signals: [{ d: 'M150 80 L270 170 L390 60 L490 210 L600 100', dur: 18, begin: 5 }]
    },
    soft: {
      vb: [1200, 760],
      pts: [[80,140],[260,60],[420,200],[300,360],[120,430],[560,90],[700,260],[560,440],[820,120],[960,300],[1100,170],[880,500],[1050,560],[700,660],[360,620]],
      edges: [[0,1],[1,2],[2,3],[3,4],[4,0],[1,5],[5,2],[5,6],[6,2],[6,7],[7,3],[5,8],[8,6],[8,9],[9,6],[8,10],[10,9],[9,11],[11,7],[11,12],[12,9],[11,13],[13,7],[3,14],[14,13],[14,4]],
      halos: [2,6,9],
      signals: []
    }
  };

  function buildMesh(kind, extraClass) {
    const m = MESHES[kind];
    const svg = el('svg', { viewBox: '0 0 ' + m.vb[0] + ' ' + m.vb[1], preserveAspectRatio: 'xMaxYMid meet', 'aria-hidden': 'true', focusable: 'false' });
    svg.setAttribute('class', 'fx-net fx-net--' + kind + (extraClass ? ' ' + extraClass : ''));
    const gEdges = el('g', {}, svg);
    m.edges.forEach((e, i) => {
      const a = m.pts[e[0]], b = m.pts[e[1]];
      const ln = el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], pathLength: 1 }, gEdges);
      ln.setAttribute('class', 'fx-edge');
      ln.style.setProperty('--i', i);
    });
    const gNodes = el('g', {}, svg);
    m.pts.forEach((p, i) => {
      const g = el('g', {}, gNodes);
      g.setAttribute('class', 'fx-nodeg');
      g.style.setProperty('--i', i);
      if (m.halos.indexOf(i) > -1) {
        const h = el('circle', { cx: p[0], cy: p[1], r: 15 }, g);
        h.setAttribute('class', 'fx-halo');
        h.style.setProperty('--i', i);
      }
      const c = el('circle', { cx: p[0], cy: p[1], r: m.halos.indexOf(i) > -1 ? 4 : 2.8 }, g);
      c.setAttribute('class', 'fx-node');
      c.style.setProperty('--i', i);
    });
    svg.fxMesh = m;
    return svg;
  }

  /* Observe un élément : ajoute .fx-in à l'arrivée, met en pause hors champ. */
  const watchers = new WeakMap();
  const ioNet = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(en => {
      const t = en.target;
      if (en.isIntersecting) {
        t.classList.add('fx-in');
        t.classList.remove('fx-off');
      } else if (t.classList.contains('fx-in')) {
        t.classList.add('fx-off');
      }
    });
  }, { threshold: 0.05 }) : null;
  const liveNets = new Set();
  function watchNet(node) {
    liveNets.add(node);
    if (ioNet) ioNet.observe(node); else node.classList.add('fx-in');
  }

  /* Pouls du réseau : au plus une animation à la fois, brève, toutes les quelques
     secondes, et seulement sur un réseau visible. Le reste du temps, le décor est
     immobile, donc gratuit pour le navigateur. */
  function spark(svg, s) {
    if (!s.pts) {
      const n = s.d.match(/-?\d+(\.\d+)?/g).map(Number);
      s.pts = []; s.cum = [0];
      for (let i = 0; i < n.length; i += 2) s.pts.push([n[i], n[i + 1]]);
      for (let i = 1; i < s.pts.length; i++) s.cum.push(s.cum[i - 1] + Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]));
    }
    const tot = s.cum[s.cum.length - 1];
    const g = el('g', {}, svg);
    el('circle', { r: 7, cx: 0, cy: 0 }, g).setAttribute('class', 'fx-spark-glow');
    el('circle', { r: 2.2, cx: 0, cy: 0 }, g).setAttribute('class', 'fx-spark-core');
    g.style.opacity = '0';
    const dur = Math.max(4200, tot * 11);
    const path = g.animate(s.pts.map((p, i) => ({ transform: 'translate(' + p[0] + 'px,' + p[1] + 'px)', offset: s.cum[i] / tot })), { duration: dur, easing: 'linear' });
    g.animate([{ opacity: 0 }, { opacity: 1, offset: .12 }, { opacity: 1, offset: .86 }, { opacity: 0 }], { duration: dur, easing: 'linear' });
    path.onfinish = () => g.remove();
  }
  function pulse(svg) {
    let nodes = Array.from(svg.querySelectorAll('.fx-nodeg'));
    /* Sous un panneau de verre, une animation obligerait le navigateur à recalculer le flou à chaque image : on pulse ailleurs. */
    const avoid = svg.fxAvoid && svg.fxAvoid.getBoundingClientRect();
    if (avoid) nodes = nodes.filter(n => {
      const r = n.getBoundingClientRect();
      return r.right < avoid.left - 24 || r.left > avoid.right + 24 || r.bottom < avoid.top - 24 || r.top > avoid.bottom + 24;
    });
    if (!nodes.length) return;
    const g = nodes[Math.floor(Math.random() * nodes.length)];
    g.classList.remove('is-beat');
    void g.getBoundingClientRect();
    g.classList.add('is-beat');
    setTimeout(() => g.classList.remove('is-beat'), 4600);
    const sig = svg.fxMesh && svg.fxMesh.signals;
    if (!avoid && sig && sig.length && Math.random() < 0.5) spark(svg, sig[Math.floor(Math.random() * sig.length)]);
  }
  function beatTick() {
    if (!document.hidden && motion()) {
      const seen = Array.from(liveNets).filter(n => n.isConnected && n.classList.contains('fx-in') && !n.classList.contains('fx-off') && n.getClientRects().length);
      if (seen.length) safe(() => pulse(seen[Math.floor(Math.random() * seen.length)]));
    }
    setTimeout(beatTick, 5200 + Math.random() * 5000);
  }
  function addMesh(host, kind, extraClass, where) {
    if (!host || host.querySelector(':scope > .fx-net--' + kind)) return null;
    const svg = buildMesh(kind, extraClass);
    if (where === 'first') host.insertBefore(svg, host.firstChild); else host.appendChild(svg);
    watchNet(svg);
    return svg;
  }

  /* ------------------------------------------------------------------ */
  /* Auras de lumière + parallaxe douce                                   */
  /* ------------------------------------------------------------------ */
  const parallax = [];   // { node, host, speed, prop, max }
  function addAura(host, css, speed) {
    if (!host || host.querySelector(':scope > .fx-aura')) return null;
    host.classList.add('fx-has-aura');
    const a = div('fx-aura', host);
    Object.keys(css).forEach(k => a.style.setProperty(k, css[k]));
    if (speed) parallax.push({ node: a, host, speed, prop: '--fx-ty', max: 120 });
    return a;
  }

  /* ------------------------------------------------------------------ */
  /* Fil de séparation entre deux sections                                */
  /* ------------------------------------------------------------------ */
  function addThread(before) {
    if (!before || !before.parentNode) return;
    const prev = before.previousElementSibling;
    if (prev && prev.classList && prev.classList.contains('fx-thread')) return;
    const t = div('fx-thread fx-reveal-thread');
    div('fx-thread-line', t, 'i');
    ['0%', '50%', '100%'].forEach((left, i) => {
      const n = div('fx-thread-node' + (i === 1 ? ' is-main' : ''), t, 'i');
      n.style.left = left;
      n.style.setProperty('--n', i);
    });
    div('fx-thread-pulse', t, 'i');
    before.parentNode.insertBefore(t, before);
    watchNet(t);
  }

  /* ------------------------------------------------------------------ */
  /* Apparitions au défilement                                            */
  /* ------------------------------------------------------------------ */
  const ioReveal = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const t = en.target;
      ioReveal.unobserve(t);
      const d = parseFloat(t.dataset.fxD || '0');
      t.classList.add('fx-in');
      if (motion() && t.animate) {
        t.animate(
          [{ opacity: 0, translate: '0 24px' }, { opacity: 1, translate: '0 0' }],
          { duration: 1100, delay: d * 1000, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }
        );
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }) : null;

  function reveal(nodes, step) {
    nodes.forEach((n, i) => {
      if (!n || n.classList.contains('fx-reveal') || n.classList.contains('reveal')) return;
      n.classList.add('fx-reveal');
      const d = (step || 0) * i;
      n.dataset.fxD = d.toFixed(2);
      n.style.setProperty('--fx-d', d.toFixed(2) + 's');
      if (ioReveal) ioReveal.observe(n); else n.classList.add('fx-in');
    });
  }
  /* Délai selon la colonne : une grille se pose par vagues, pas d'un bloc. */
  function revealGrid(nodes) {
    if (!nodes.length) return;
    const cols = Math.max(1, getComputedStyle(nodes[0].parentElement).gridTemplateColumns.split(' ').length);
    nodes.forEach((n, i) => reveal([n], 0));
    nodes.forEach((n, i) => {
      const d = ((i % cols) * 0.08);
      n.dataset.fxD = d.toFixed(2);
      n.style.setProperty('--fx-d', d.toFixed(2) + 's');
    });
  }

  /* ------------------------------------------------------------------ */
  /* Lumière qui suit le curseur dans les bandeaux                        */
  /* ------------------------------------------------------------------ */
  function addSpot(host, cool) {
    if (!host || host.querySelector(':scope > .fx-spot')) return;
    const spot = div('fx-spot' + (cool ? ' fx-spot--cool' : ''), host);
    const st = { x: 0, y: 0, tx: 0, ty: 0, raf: 0, on: false };
    const tick = () => {
      st.x += (st.tx - st.x) * 0.1;
      st.y += (st.ty - st.y) * 0.1;
      spot.style.transform = 'translate3d(' + st.x.toFixed(1) + 'px,' + st.y.toFixed(1) + 'px,0)';
      if (st.on || Math.abs(st.tx - st.x) > 0.5 || Math.abs(st.ty - st.y) > 0.5) st.raf = requestAnimationFrame(tick); else st.raf = 0;
    };
    host.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch' || !motion()) return;
      const r = host.getBoundingClientRect();
      st.tx = e.clientX - r.left; st.ty = e.clientY - r.top;
      if (!st.on) { st.on = true; st.x = st.tx; st.y = st.ty; spot.classList.add('is-on'); }
      if (!st.raf) st.raf = requestAnimationFrame(tick);
    }, { passive: true });
    host.addEventListener('pointerleave', () => { st.on = false; spot.classList.remove('is-on'); });
  }

  /* ------------------------------------------------------------------ */
  /* Cartes : lueur au survol (délégation, car le catalogue se redessine) */
  /* ------------------------------------------------------------------ */
  const LIT = '.collective-card, #p-training .catalog-card, #p-training .catalog-domain, #p-training .catalog-calendar-session, #p-join .mode-card';
  function markLit(scope) {
    if (scope.nodeType !== 1) return;
    if (scope.matches && scope.matches(LIT)) scope.classList.add('fx-lit');
    if (scope.querySelectorAll) scope.querySelectorAll(LIT).forEach(n => n.classList.add('fx-lit'));
  }
  let litRaf = 0, litEv = null;
  document.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    litEv = e;
    if (litRaf) return;
    litRaf = requestAnimationFrame(() => {
      litRaf = 0;
      const t = litEv.target && litEv.target.closest ? litEv.target.closest('.fx-lit') : null;
      if (!t) return;
      const r = t.getBoundingClientRect();
      t.style.setProperty('--mx', (litEv.clientX - r.left).toFixed(0) + 'px');
      t.style.setProperty('--my', (litEv.clientY - r.top).toFixed(0) + 'px');
    });
  }, { passive: true });

  /* ------------------------------------------------------------------ */
  /* Navigation : indicateur glissant                                     */
  /* ------------------------------------------------------------------ */
  function setupNav() {
    const nav = $('#nav');
    if (!nav || $('.fx-ink', nav)) return;
    const ink = div('fx-ink', nav, 'span');
    const btns = $$('button:not(.hot)', nav);
    const active = () => $('button.active:not(.hot)', nav);
    const to = b => {
      if (!b || getComputedStyle(ink).display === 'none') { if (ink.classList.contains('is-on')) ink.classList.remove('is-on'); return; }
      ink.style.setProperty('--x', (b.offsetLeft + 10) + 'px');
      ink.style.setProperty('--w', Math.max(0, b.offsetWidth - 20) + 'px');
      if (!ink.classList.contains('is-on')) ink.classList.add('is-on');
    };
    const rest = () => to(active());
    btns.forEach(b => {
      b.addEventListener('pointerenter', () => to(b));
      b.addEventListener('focus', () => to(b));
      b.addEventListener('blur', rest);
    });
    nav.addEventListener('pointerleave', rest);
    const mo = new MutationObserver(rest);
    $$('button', nav).forEach(b => mo.observe(b, { attributes: true, attributeFilter: ['class'] }));
    addEventListener('resize', rest, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(rest);
    rest();
    setTimeout(rest, 400);
  }

  /* ------------------------------------------------------------------ */
  /* Défilement : fil de lecture + parallaxe                              */
  /* ------------------------------------------------------------------ */
  let progress = null, ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      if (progress) {
        const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
        progress.style.setProperty('--p', Math.min(1, Math.max(0, scrollY / max)).toFixed(4));
      }
      if (!motion() || innerWidth < 761) return;
      const vh = innerHeight;
      parallax.forEach(p => {
        const r = p.host.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const off = (r.top + r.height / 2 - vh / 2) * p.speed;
        const v = Math.max(-p.max, Math.min(p.max, off));
        p.node.style.setProperty(p.prop, v.toFixed(1) + 'px');
      });
    });
  }
  function setupProgress() {
    const bar = $('#hdr .navbar');
    if (!bar || $('.fx-progress', bar)) return;
    progress = div('fx-progress', bar);
  }

  /* ------------------------------------------------------------------ */
  /* Composition page par page                                            */
  /* ------------------------------------------------------------------ */
  function composeHome() {
    const hero = $('#p-home .public-home-photo');
    if (hero) {
      addSpot(hero);
      const img = $('img', hero);
      if (img) parallax.push({ node: img, host: hero, speed: -0.09, prop: '--fx-py', max: 40 });
    }
    $$('#p-home .public-hero-copy').forEach(n => n.classList.add('fx-stage'));
    reveal([$('#p-home .public-story-stage .public-section-heading')], 0);
    reveal([$('#p-home .public-story-text')], 0.12);
    reveal($$('#p-home > .public-soft-band .public-section-heading'), 0);
    reveal($$('#p-home > .public-soft-band .public-card'), 0.2);
    reveal([$('#p-home .public-end-cta')], 0);
    const stage = $('#p-home .public-story-stage');
    addAura(stage, { '--s': '760px', '--a': .26, top: '-6%', right: '-10%' }, 0.1);
    addAura(stage, { '--s': '520px', '--a': .16, bottom: '-10%', left: '-8%' }, -0.08);
    const steps = $('#p-home > .public-soft-band');
    addAura(steps, { '--s': '640px', '--a': .2, top: '18%', right: '-12%' }, 0.1);
    addThread(steps);
    const cta = $('#p-home .public-end-cta');
    addThread(cta);
    if (cta) { addMesh(cta, 'soft', 'fx-net--cta'); addAura(cta, { '--s': '520px', '--a': .26, top: '-40%', right: '-6%' }); }
  }

  function composeEnterprise() {
    const hero = $('#p-enterprise .public-enterprise-hero');
    if (hero) {
      addSpot(hero);
      div('fx-sweep', hero);
      $$('#p-enterprise .public-inner-hero-content').forEach(n => n.classList.add('fx-stage'));
    }
    reveal($$('#p-enterprise > .public-section.public-wrap .public-section-heading'), 0);
    reveal($$('#p-enterprise > .public-section.public-wrap .public-card'), 0.2);
    const audit = $('#audit-option');
    reveal([$('#audit-option .public-audit-grid > div:first-child'), $('#audit-option .public-audit-aside')], 0.14);
    reveal([$('#besoin-formulaire .public-request-intro'), $('#besoin-formulaire .public-form')], 0.14);
    addThread(audit);
    addAura(audit, { '--s': '700px', '--a': .22, top: '-8%', right: '-10%' }, 0.1);
    const form = $('#besoin-formulaire');
    addThread(form);
    addAura(form, { '--s': '680px', '--a': .26, top: '10%', right: '-8%' }, 0.1);
  }

  function composeNetwork() {
    const hero = $('#p-network .public-network-hero');
    if (hero) {
      addSpot(hero, true);
      const net = addMesh(hero, 'hero', '', 'first');
      if (net) net.fxAvoid = $('.public-network-hero-grid', hero);
      if (net && mqHover.matches) {
        let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
        const step = () => {
          x += (tx - x) * 0.06; y += (ty - y) * 0.06;
          net.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
          raf = (Math.abs(tx - x) > 0.2 || Math.abs(ty - y) > 0.2) ? requestAnimationFrame(step) : 0;
        };
        hero.addEventListener('pointermove', e => {
          if (!motion()) return;
          const r = hero.getBoundingClientRect();
          tx = ((e.clientX - r.left) / r.width - 0.5) * -22;
          ty = ((e.clientY - r.top) / r.height - 0.5) * -14;
          if (!raf) raf = requestAnimationFrame(step);
        }, { passive: true });
      }
      $$('#p-network .public-network-hero-grid').forEach(n => n.classList.add('fx-stage'));
    }
    const story = $('#p-network .public-collective-story');
    reveal([$('#p-network .public-collective-story .public-section-heading'), $('#p-network .collective-intro')], 0.14);
    const members = $('#p-network .public-soft-band');
    if (members) {
      reveal($$('.public-section-heading', members), 0);
      revealGrid($$('.collective-card', members));
      addMesh(members, 'soft', 'fx-net--members');
      addAura(members, { '--s': '820px', '--a': .22, top: '10%', left: '-14%' }, 0.08);
      addThread(members);
    }
    const map = $('#p-network .public-map-stage');
    if (map) {
      addAura(map, { '--s': '760px', '--a': .24, top: '-4%', right: '-12%' }, 0.08);
      addThread(map);
      reveal([$('.public-map-intro h2', map)], 0);
    }
    addAura(story, { '--s': '640px', '--a': .22, top: '-10%', left: '-10%' }, 0.1);
  }

  function composeTraining() {
    const hero = $('#p-training .hero.forma');
    if (hero) {
      addSpot(hero);
      div('fx-sweep', hero);
      $$('#p-training .hero.forma .copy').forEach(n => n.classList.add('fx-stage'));
    }
    reveal([$('#p-training .catalog-toolbar')], 0);
    revealGrid($$('#p-training .catalog-domain-list > .catalog-domain'));
    reveal([$('#p-training .catalog-sessions-calendar')], 0);
    reveal($$('#p-training .catalog-cta'), 0);
    const main = $('#p-training .catalog-main');
    addAura(main, { '--s': '760px', '--a': .22, top: '6%', right: '-14%' }, 0.08);
    addAura(main, { '--s': '560px', '--a': .16, bottom: '2%', left: '-10%' }, -0.06);
    const cal = $('#p-training .catalog-sessions-calendar');
    addThread(cal);
  }

  function composeJoin() {
    const hero = $('#p-join .hero.join');
    if (hero) {
      addSpot(hero);
      div('fx-sweep', hero);
      $$('#p-join .hero.join .copy').forEach(n => n.classList.add('fx-stage'));
      const jn = addMesh(hero, 'dark', 'fx-net--join');
      if (jn) jn.fxAvoid = $('.copy', hero);
    }
    const extra = $('#p-join .join-extra');
    addThread(extra);
    addAura(extra, { '--s': '700px', '--a': .24, top: '-6%', right: '-10%' }, 0.1);
    const stmt = $('#p-join .statement > .section');
    if (stmt) addMesh(stmt, 'dark', 'fx-net--statement');
    const cta = $('#p-join .cta');
    if (cta) addMesh(cta, 'dark', 'fx-net--cta');
    /* Les trois cartes passent sous le système d'apparition commun (délais en vague). */
    const cards = $$('#p-join .mode-card');
    cards.forEach(n => n.classList.remove('reveal'));
    reveal(cards, 0.14);
    const principle = $('#p-join .section .head');
    addAura(principle && principle.parentElement, { '--s': '700px', '--a': .22, top: '-10%', left: '-10%' }, 0.08);
  }

  function composeFooter() {
    const f = $('footer');
    if (!f) return;
    addMesh(f, 'dark', 'fx-net--footer');
  }

  /* ------------------------------------------------------------------ */
  /* Initialisation                                                       */
  /* ------------------------------------------------------------------ */
  function init() {
    safe(setupProgress);
    safe(setupNav);
    safe(composeHome);
    safe(composeEnterprise);
    safe(composeNetwork);
    safe(composeTraining);
    safe(composeJoin);
    safe(composeFooter);
    root.classList.add('fx-ready');
    safe(() => markLit(document.body));
    if ('MutationObserver' in window) {
      new MutationObserver(list => list.forEach(m => m.addedNodes.forEach(markLit)))
        .observe(document.querySelector('main') || document.body, { childList: true, subtree: true });
    }
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    onScroll();

    /* Si l'utilisateur change sa préférence de mouvement en cours de visite. */
    const sync = () => {
      root.classList.toggle('fx', motion());
      if (!motion()) $$('.fx-reveal').forEach(n => n.classList.add('fx-in'));
    };
    if (mqReduce.addEventListener) mqReduce.addEventListener('change', sync);
    else if (mqReduce.addListener) mqReduce.addListener(sync);
    setTimeout(beatTick, 4500);
    safe(guard);
  }

  /* Garde-fou de fluidité : on observe les images pendant le défilement ; si plus du
     quart dépasse 45 ms sur 40 images, on passe en mode allégé (sans flou d'arrière-plan). */
  function guard() {
    let active = false, last = 0, frames = 0, slow = 0, stopAt = 0;
    const tick = t => {
      if (!active) return;
      if (last && !document.hidden) {
        const d = t - last;
        if (d < 400) { frames++; if (d > 45) slow++; }
      }
      last = t;
      if (frames >= 40) {
        if (slow / frames > 0.25) { root.classList.add('fx-lite'); active = false; return; }
        frames = 0; slow = 0;
      }
      if (t < stopAt) requestAnimationFrame(tick); else active = false;
    };
    addEventListener('scroll', () => {
      if (root.classList.contains('fx-lite')) return;
      stopAt = performance.now() + 1500;
      if (!active) { active = true; last = 0; frames = 0; slow = 0; requestAnimationFrame(tick); }
    }, { passive: true });
  }

  init();
})();
