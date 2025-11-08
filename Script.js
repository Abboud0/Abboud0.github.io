// Mobile menu
function toggleMenu() {
  const ul = document.querySelector("nav ul");
  if (ul) ul.classList.toggle("active");
}

// Reveal on scroll (projects, etc.)
(function () {
  const groups = [
    { container: document.querySelector('#projects .projects__grid'), items: '.project' }
  ];

  const targets = [];
  groups.forEach(({ container, items }) => {
    if (!container) return;
    container.querySelectorAll(items).forEach((el, i) => {
      el.classList.add('reveal');
      el.style.setProperty('--d', `${Math.min(i * 0.1, 0.6)}s`);
      targets.push(el);
    });
  });

  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

  targets.forEach(el => io.observe(el));

  // Last-resort fallback if something prevents IO:
  setTimeout(() => {
    const anyVisible = targets.some(el => el.classList.contains('is-visible'));
    if (!anyVisible) targets.forEach(el => el.classList.add('is-visible'));
  }, 1000);
})();

(function ensureProjectsVisibleIfShortPage() {
  const cards = document.querySelectorAll('.projects__grid .project');
  if (!cards.length) return;
  const short = (document.documentElement.scrollHeight - window.innerHeight) < 160;
  if (short) cards.forEach(el => el.classList.add('is-visible'));
})();


// === Keep a visible handle when hidden ===
document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("peeking-avatar");
  if (!el || !window.gsap) return;

  // how many px remain visible when "hidden"
  const handle = () => (
    window.innerWidth <= 600 ? 10 :      // phones
    window.innerWidth <= 900 ? 12 : 16   // tablets / desktop
  );

  // compute hidden left based on actual rendered width
  const hiddenLeft = () => {
    const w = el.getBoundingClientRect().width || el.offsetWidth || 120;
    return -(w - handle());              // negative so only 'handle()' peeks
  };

  const show = () => gsap.to(el, { left: 0, duration: 0.3, ease: "power2.out" });
  const hide = () => gsap.to(el, { left: hiddenLeft(), duration: 0.5, ease: "power2.out" });

  // start hidden-but-peeking
  gsap.set(el, { left: hiddenLeft() });

  // desktop hover
  el.addEventListener("mouseenter", show);
  el.addEventListener("mouseleave", hide);

  // recalc when the image size becomes known or viewport changes
  if (!el.complete) el.addEventListener("load", () => gsap.set(el, { left: hiddenLeft() }));
  window.addEventListener("resize", () => {
    const cur = parseFloat(getComputedStyle(el).left) || 0;
    if (cur < 0) gsap.set(el, { left: hiddenLeft() });
  });
});


function toggleMenu() { document.querySelector("nav ul").classList.toggle("active"); }

// =====================
// Soft constellation background (safe layering)
// =====================
(() => {
  const canvas = document.getElementById('bg-stars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  let w, h, dpr, particles = [], mouse = { x: 0, y: 0, active: false }, raf, lastNow = 0;
  const cfg = { density: 0.00012, maxSpeed: 0.28, linkDist: 110, linkAlpha: 0.16, size: [1, 2.2], hue: 210, sway: 0.0006 };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = Math.floor(innerWidth * dpr);
    h = canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = Math.floor(w / dpr) + 'px';
    canvas.style.height = Math.floor(h / dpr) + 'px';
    const count = Math.floor((w / dpr) * (h / dpr) * cfg.density);
    particles = Array.from({ length: count }, () => {
      const ang = Math.random() * Math.PI * 2, spd = cfg.maxSpeed * (0.4 + Math.random() * 0.6);
      return { x: Math.random() * w, y: Math.random() * h, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, size: cfg.size[0] + Math.random() * (cfg.size[1] - cfg.size[0]), phase: Math.random() * 10000 };
    });
  }
  function step(dt) {
    const mdx = (mouse.x || w * 0.5) - w * 0.5, mdy = (mouse.y || h * 0.5) - h * 0.5;
    const par = mouse.active ? 0.00003 : 0.00001;
    for (const p of particles) {
      p.phase += dt * cfg.sway;
      p.vx += Math.cos(p.phase) * 0.0002; p.vy += Math.sin(p.phase) * 0.0002;
      p.x += p.vx * dpr + mdx * par; p.y += p.vy * dpr + mdy * par;
      if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10; if (p.y > h + 10) p.y = -10;
    }
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    // links
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
        if (d < cfg.linkDist * dpr) {
          const alpha = (1 - d / (cfg.linkDist * dpr)) * cfg.linkAlpha;
          ctx.strokeStyle = `hsla(${cfg.hue},80%,70%,${alpha})`;
          ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    // particles
    for (const p of particles) {
      ctx.fillStyle = `hsla(${cfg.hue + (p.phase % 30)},90%,70%,0.85)`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * dpr, 0, Math.PI * 2); ctx.fill();
    }
  }
  function loop(now) { const dt = Math.min(32, (now - lastNow) || 16); lastNow = now; step(dt); draw(); raf = requestAnimationFrame(loop); }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect(); mouse.x = (e.clientX - r.left) * dpr; mouse.y = (e.clientY - r.top) * dpr; mouse.active = true;
  }, { passive: true });
  window.addEventListener('mouseleave', () => { mouse.active = false; }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); raf = null; } else { loop(performance.now()); } });

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    draw(); // static
  } else {
    loop(performance.now());
  }
})();

// =====================
// Hero rotating roles
// =====================
(() => {
  const wrap = document.querySelector('.hero__rotating'); if (!wrap) return;
  const items = [...wrap.querySelectorAll('.rotating-item')]; if (!items.length) return;
  let i = 0; items[0].classList.add('is-active');
  setInterval(() => { items[i].classList.remove('is-active'); i = (i + 1) % items.length; items[i].classList.add('is-active'); }, 2200);
})();

// =====================
// Scroll hint -> About
// =====================
(() => {
  const btn = document.querySelector('.hero__scroll'), about = document.getElementById('about');
  if (!btn || !about) return;
  btn.addEventListener('click', () => about.scrollIntoView({ behavior: 'smooth', block: 'start' }));
})();

// =====================
// Skills Map (hover + filters + neat labels)
// =====================
(() => {
  const root = document.querySelector('.skills'); if (!root) return;
  const svg = root.querySelector('svg'); if (!svg) return;

  const nodes = [...svg.querySelectorAll('.node')];
  const edges = [...svg.querySelectorAll('.edge')];
  const filters = [...root.querySelectorAll('.sfilter')];

  // proficiency rings
  nodes.forEach(n => {
    const ring = n.querySelector('.ring[data-level]'); if (!ring) return;
    const r = parseFloat(ring.getAttribute('r'));
    const level = Math.max(0, Math.min(100, parseFloat(ring.getAttribute('data-level')) || 0));
    const C = 2 * Math.PI * r, filled = (level / 100) * C;
    ring.setAttribute('stroke-dasharray', `${filled} ${C - filled}`); ring.setAttribute('stroke-linecap', 'round');
  });

  // centers
  const centers = new Map(nodes.map(n => {
    const t = n.getAttribute('transform') || ''; const m = /translate\(([-\d.]+)\s+([-\d.]+)\)/.exec(t);
    if (!m) { const d = n.querySelector('.dot'); return [n, { x: parseFloat(d.getAttribute('cx')), y: parseFloat(d.getAttribute('cy')) }] }
    return [n, { x: parseFloat(m[1]), y: parseFloat(m[2]) }];
  }));

  // trimming helpers (keep lines from crossing dots)
  function nearestNode(px, py) {
    let best = null, bd = Infinity;
    for (const n of nodes) { const c = centers.get(n); const dx = c.x - px, dy = c.y - py; const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = n; } }
    return bd <= (80 * 80) ? best : null;
  }
  function trimEdges() {
    edges.forEach(e => {
      let x1 = +e.getAttribute('x1'), y1 = +e.getAttribute('y1'), x2 = +e.getAttribute('x2'), y2 = +e.getAttribute('y2');
      if (![x1, y1, x2, y2].every(Number.isFinite)) return;
      const A = nearestNode(x1, y1), B = nearestNode(x2, y2); if (!A || !B) return;
      const cA = centers.get(A), cB = centers.get(B);
      const rA = +(A.querySelector('.dot')?.getAttribute('r')) || 18, rB = +(B.querySelector('.dot')?.getAttribute('r')) || 18;
      const vx = cB.x - cA.x, vy = cB.y - cA.y, L = Math.hypot(vx, vy) || 1, ux = vx / L, uy = vy / L;
      e.setAttribute('x1', cA.x + ux * rA); e.setAttribute('y1', cA.y + uy * rA);
      e.setAttribute('x2', cB.x - ux * rB); e.setAttribute('y2', cB.y - uy * rB);
    });
  }
  trimEdges(); window.addEventListener('resize', trimEdges, { passive: true });

  // hover connectivity (robust)
  function connected(node, edge) {
    if (edge.dataset.from && edge.dataset.to && node.id) {
      return edge.dataset.from === node.id || edge.dataset.to === node.id;
    }
    const c = centers.get(node), r = +(node.querySelector('.dot')?.getAttribute('r')) || 18;
    const RING_TOL = 10, CENTER_TOL = 10;
    const x1 = +edge.getAttribute('x1'), y1 = +edge.getAttribute('y1'), x2 = +edge.getAttribute('x2'), y2 = +edge.getAttribute('y2');
    if (![x1, y1, x2, y2].every(Number.isFinite)) return false;
    const d1 = Math.hypot(c.x - x1, c.y - y1), d2 = Math.hypot(c.x - x2, c.y - y2);
    return Math.abs(d1 - r) <= RING_TOL || Math.abs(d2 - r) <= RING_TOL || d1 <= CENTER_TOL || d2 <= CENTER_TOL;
  }

  nodes.forEach(n => {
    n.addEventListener('mouseover', ev => {
      if (n.contains(ev.relatedTarget)) return;
      nodes.forEach(x => { if (x !== n) x.classList.add('dim'); });
      edges.forEach(e => connected(n, e) ? e.classList.add('highlight') : e.classList.add('dim'));
    });
    n.addEventListener('mouseout', ev => {
      if (n.contains(ev.relatedTarget)) return;
      nodes.forEach(x => x.classList.remove('dim'));
      edges.forEach(e => { e.classList.remove('highlight'); e.classList.remove('dim'); });
    });
  });

  // filters
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const f = btn.getAttribute('data-filter');
      if (f === 'all') { nodes.forEach(n => n.classList.remove('dim')); edges.forEach(e => e.classList.remove('dim')); return; }
      nodes.forEach(n => {
        const cats = (n.getAttribute('data-cat') || '').split(',').map(s => s.trim());
        cats.includes(f) ? n.classList.remove('dim') : n.classList.add('dim');
      });
      edges.forEach(e => e.classList.add('dim'));
    });
  });

  // place labels outside rings (with optional data-label-* overrides)
  (function placeLabels() {
    const vb = svg.viewBox.baseVal;
    const core = svg.querySelector('.node.core');
    const cdot = core && core.querySelector('.dot');
    const CORE = { x: cdot ? +cdot.getAttribute('cx') : vb.width / 2, y: cdot ? +cdot.getAttribute('cy') : vb.height / 2 };

    function layout(n) {
      if (n.classList.contains('core')) return;
      const t = n.querySelector('text.label'), ring = n.querySelector('.ring'); if (!t || !ring) return;
      const r = +ring.getAttribute('r') || 24, c = centers.get(n);
      const vx = c.x - CORE.x, vy = c.y - CORE.y, len = Math.max(1, Math.hypot(vx, vy)), ux = vx / len, uy = vy / len;
      const gap = 14, tx = ux * (r + gap), ty = uy * (r + 2);
      const hasAbs = ('labelX' in n.dataset) || ('labelY' in n.dataset);
      const dx = +(n.dataset.labelDx || 0), dy = +(n.dataset.labelDy || 0);
      const lx = hasAbs ? +(n.dataset.labelX || 0) : (tx + dx);
      const ly = hasAbs ? +(n.dataset.labelY || 0) : (ty + dy);
      const anchor = n.dataset.labelAnchor || (hasAbs ? 'start' : (ux < 0 ? 'end' : 'start'));
      t.setAttribute('x', lx); t.setAttribute('y', ly); t.setAttribute('text-anchor', anchor);

      let lead = n.querySelector('line.leader');
      if (!lead) { lead = document.createElementNS('http://www.w3.org/2000/svg', 'line'); lead.setAttribute('class', 'leader'); n.appendChild(lead); }
      lead.setAttribute('x1', ux * r); lead.setAttribute('y1', uy * r);
      lead.setAttribute('x2', ux * (r + 8)); lead.setAttribute('y2', uy * (r + 8));

      let bg = n.querySelector('rect.label-bg');
      if (!bg) { bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); bg.setAttribute('class', 'label-bg'); n.insertBefore(bg, t); }
      const sizeBg = () => { const bb = t.getBBox(); bg.setAttribute('x', bb.x - 6); bg.setAttribute('y', bb.y - 4); bg.setAttribute('width', bb.width + 12); bg.setAttribute('height', bb.height + 8); };
      if (document.fonts && document.fonts.ready) { document.fonts.ready.then(() => requestAnimationFrame(sizeBg)); } else { requestAnimationFrame(sizeBg); }
    }

    nodes.forEach(layout);
    window.addEventListener('resize', () => nodes.forEach(layout), { passive: true });
  })();
})();

// =====================
// Reveal on scroll (projects, cards, etc.)
// =====================
document.addEventListener('DOMContentLoaded', () => {
  const targets = [...document.querySelectorAll('.reveal')];

  // No IO support? just show everything.
  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

  targets.forEach(el => io.observe(el));
});

(function () {
  const grid = document.querySelector('.projects__grid');
  if (!grid) return;
  const cards = [...grid.querySelectorAll('.project')];
  cards.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.setProperty('--d', `${Math.min(i * 0.1, 0.6)}s`);
  });

  if (!('IntersectionObserver' in window)) {
    cards.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

  cards.forEach(el => io.observe(el));
})();

(function initProjectsRevealSafe() {
  function init() {
    try {
      const grid = document.querySelector('.projects__grid');
      if (!grid) return;

      const cards = Array.from(grid.querySelectorAll('.project'));
      if (!cards.length) return;

      // ensure .reveal is present (in case some cards don't have it)
      cards.forEach((el, i) => {
        el.classList.add('reveal');
        el.style.setProperty('--d', `${Math.min(i * 0.1, 0.6)}s`);
      });

      // If IO not supported, just show everything
      if (!('IntersectionObserver' in window)) {
        cards.forEach(el => el.classList.add('is-visible'));
        return;
      }

      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

      cards.forEach(el => io.observe(el));

      // last-ditch fallback: if nothing became visible after 1000ms, show them
      setTimeout(() => {
        const anyVisible = cards.some(el => el.classList.contains('is-visible'));
        if (!anyVisible) cards.forEach(el => el.classList.add('is-visible'));
      }, 1000);
    } catch (err) {
      // if any JS error elsewhere stops execution, fail open
      console.error('reveal init error:', err);
      document.querySelectorAll('.project.reveal').forEach(el => el.classList.add('is-visible'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

// =====================
// Live Demo modal helpers (openDemo / closeDemo)
// =====================
(() => {
  function getEls() {
    return {
      overlay: document.getElementById('demoOverlay'),
      frame: document.getElementById('demoFrame'),
      titleEl: document.getElementById('demoTitle'),
      openNew: document.getElementById('demoOpenNew'),
      spinner: document.getElementById('demoSpinner'),
      blocked: document.getElementById('demoBlocked'),
      closeBtn: document.getElementById('demoClose')
    };
  }

  window.openDemo = function (url, title) {
    const { overlay, frame, titleEl, openNew, spinner, blocked } = getEls();
    if (!overlay || !frame) return;

    titleEl && (titleEl.textContent = title || 'Live Demo');
    openNew && (openNew.href = url);
    if (spinner) spinner.style.display = 'grid';
    if (blocked) blocked.hidden = true;
    frame.src = 'about:blank';

    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => { frame.src = url; });

    const t = setTimeout(() => {
      if (spinner) spinner.style.display = 'none';
      if (blocked) blocked.hidden = false;
    }, 4000);

    function onload() {
      clearTimeout(t);
      if (spinner) spinner.style.display = 'none';
      frame.removeEventListener('load', onload);
    }
    frame.addEventListener('load', onload);
  };

  window.closeDemo = function () {
    const { overlay, frame } = getEls();
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    if (frame) frame.src = 'about:blank';
  };

  // backdrop click + ESC + explicit close button
  document.addEventListener('click', (e) => {
    const { overlay, closeBtn } = getEls();
    if (!overlay) return;
    if (e.target === overlay || e.target === closeBtn) window.closeDemo();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') window.closeDemo();
  });
})();

// =====================
// Optional: open landing popup automatically (if present)
// =====================
document.addEventListener('DOMContentLoaded', () => {
  const p = document.getElementById('popup');
  if (p) p.classList.add('active');
});
window.closePopup = function () {
  const p = document.getElementById('popup');
  if (p) p.classList.remove('active');
};

