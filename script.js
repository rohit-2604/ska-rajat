/* ==========================================================================
   সৃজনী কলা অ্যাকাডেমী — রজতজয়ন্তী বর্ষ উদযাপন
   Interaction & animation system
   - GSAP + ScrollTrigger drive all entrance/scroll choreography
   - Lenis provides smooth scrolling (synced to ScrollTrigger)
   - CSS handles ambient loops (particles, gradients, marquees, borders)
   The page stays fully readable if any CDN library fails to load.
   ========================================================================== */
(() => {
  'use strict';

  /* ---------- Editable configuration ---------- */
  const CONFIG = {
    // Evening recital start (IST) — drives the countdown
    eventStart: new Date('2026-12-26T18:00:00+05:30'),
    socialLinks: {
      // Paste real profile URLs here; empty values show a "coming soon" toast.
      instagram: '',
      facebook: '',
      youtube: '',
    },
  };

  /* ---------- Environment ---------- */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  root.classList.add('js');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  const hasST = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  const animate = hasST && !reduceMotion;
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  const BN = '০১২৩৪৫৬৭৮৯';
  const bn = (n, pad = 0) => String(n).padStart(pad, '0').replace(/\d/g, (d) => BN[d]);

  let lenis = null;

  /* ---------- Bengali-safe text splitting ----------
     Splitting Bengali by code point breaks conjuncts (যুক্তাক্ষর) and detaches
     vowel signs. We group each base letter with its combining marks, and keep
     consonants joined by a hasanta (্) in the same cluster. */
  const COMBINING = /[ঁ-ঃ়া-ৄেৈো-্ৗৢৣ‌‍]/;
  const HASANTA = '্';

  function graphemes(word) {
    const out = [];
    let prev = '';
    for (const ch of word) {
      if (out.length && (COMBINING.test(ch) || prev === HASANTA || ch === '‍')) {
        out[out.length - 1] += ch;
      } else {
        out.push(ch);
      }
      prev = ch;
    }
    return out;
  }

  /** Splits an element's text into words (and optionally characters).
   *  Adds a screen-reader copy so assistive tech reads the sentence normally. */
  function splitText(el, mode = 'words') {
    if (el.dataset.splitDone) return $$(mode === 'chars' ? '.split-c' : '.split-wi', el);
    const text = el.textContent.trim().replace(/\s+/g, ' ');
    el.textContent = '';
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');

    const units = [];
    text.split(' ').forEach((word, i, arr) => {
      const w = document.createElement('span');
      w.className = 'split-w';
      if (mode === 'chars') {
        graphemes(word).forEach((g) => {
          const c = document.createElement('span');
          c.className = 'split-c';
          c.textContent = g;
          w.appendChild(c);
          units.push(c);
        });
      } else {
        const inner = document.createElement('span');
        inner.className = 'split-wi';
        inner.textContent = word;
        w.appendChild(inner);
        units.push(inner);
      }
      visual.appendChild(w);
      if (i < arr.length - 1) visual.appendChild(document.createTextNode(' '));
    });

    el.append(sr, visual);
    el.dataset.splitDone = '1';
    return units;
  }

  /* ======================================================================
     SMOOTH SCROLL (Lenis ⇄ ScrollTrigger)
     ====================================================================== */
  function initSmoothScroll() {
    if (reduceMotion || typeof window.Lenis === 'undefined') return;
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });
    root.style.scrollBehavior = 'auto';
    if (hasST) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  function scrollToTarget(target) {
    const el = typeof target === 'string' ? (target === '#top' ? document.body : $(target)) : target;
    if (!el) return;
    if (lenis) {
      lenis.scrollTo(el === document.body ? 0 : el, { offset: 0, duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
    } else {
      const y = el === document.body ? 0 : el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  function lockScroll(lock) {
    document.body.classList.toggle('is-locked', lock);
    if (lenis) lock ? lenis.stop() : lenis.start();
  }

  /* ======================================================================
     LOADER
     ====================================================================== */
  function runLoader() {
    const loader = $('#loader');
    if (!loader) return Promise.resolve();
    if (!hasGSAP || reduceMotion) {
      loader.remove();
      return Promise.resolve();
    }
    loader.style.animation = 'none'; // JS takes over from the CSS safety net
    lockScroll(true);

    const num = $('#loaderNum');
    const counter = { v: 0 };
    const assetsReady = Promise.race([
      Promise.all([
        document.fonts ? document.fonts.ready : Promise.resolve(),
        new Promise((r) => (document.readyState === 'complete' ? r() : window.addEventListener('load', r, { once: true }))),
      ]),
      new Promise((r) => setTimeout(r, 3500)),
    ]);

    const counted = new Promise((done) => {
      gsap.timeline({ onComplete: done })
        .to(counter, {
          v: 25, duration: 1.8, ease: 'power2.inOut',
          onUpdate: () => { num.textContent = bn(Math.round(counter.v)); },
        })
        .to('#loaderBar', { scaleX: 1, duration: 1.8, ease: 'power2.inOut' }, 0);
    });

    return Promise.all([counted, assetsReady]).then(() => new Promise((resolve) => {
      gsap.timeline({ onComplete: () => { loader.remove(); lockScroll(false); } })
        .to('.loader__inner', { y: -40, opacity: 0, duration: 0.6, ease: 'power3.in' })
        .to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, '-=0.1')
        .add(resolve, '-=0.85'); // hero starts while the curtain lifts
    }));
  }

  /* ======================================================================
     HERO INTRO
     ====================================================================== */
  function buildHeroIntro() {
    if (!animate) return null;
    const kickerChars = splitText($('.hero__kicker'), 'chars');
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });

    tl.fromTo('.hero__bg', { scale: 1.28 }, { scale: 1, duration: 3, ease: 'power2.out' }, 0)
      .from('.nav__bar', { y: -40, opacity: 0, duration: 1.2 }, 0.2)
      .from('.hero__eyebrow', { y: 20, opacity: 0, duration: 1 }, 0.25)
      .from(kickerChars, { y: '0.6em', opacity: 0, rotate: 6, duration: 1, stagger: 0.016 }, 0.3)
      .fromTo('.hero__title-line',
        { clipPath: 'inset(0% 100% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, stagger: 0.2, ease: 'power4.inOut', clearProps: 'clipPath' }, 0.55)
      .from('.hero__title-line', { x: -30, duration: 1.6, stagger: 0.2 }, 0.55)
      .from(['.hero__subtitle', '.hero__support'], { y: 40, opacity: 0, duration: 1.1, stagger: 0.12 }, 1.2)
      .fromTo('.hero__reveal',
        { clipPath: 'inset(100% 0% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.7, ease: 'power4.inOut', clearProps: 'clipPath' }, 0.7)
      .from('.hero__frame img', { scale: 1.35, duration: 2.4 }, 0.7)
      .from('.hero__arch-line', { opacity: 0, scale: 0.9, duration: 1.6 }, 1.3)
      .from('.hero__ctas > *', { y: 50, opacity: 0, duration: 1.1, stagger: 0.12 }, 1.45)
      .from('.hero__badge', { scale: 0, opacity: 0, duration: 1.4, ease: 'back.out(1.6)' }, 1.6)
      .from('.hero__tag', { x: 40, opacity: 0, duration: 1.2 }, 1.75)
      .from('.hero__dock', { y: 50, opacity: 0, duration: 1.2 }, 1.6)
      .from('.hero__dock > *', { opacity: 0, duration: 0.8, stagger: 0.08 }, 1.75)
      .from('.scroll-cue', { opacity: 0, duration: 1 }, 2.2);
    return tl;
  }

  /** Subtle pointer parallax inside the hero (desktop only) */
  function initHeroParallax() {
    if (!animate || !finePointer) return;
    const hero = $('.hero');
    const art = gsap.quickTo('.hero__art', 'x', { duration: 1.2, ease: 'power3' });
    const artY = gsap.quickTo('.hero__art', 'y', { duration: 1.2, ease: 'power3' });
    const glowX = gsap.quickTo('.hero__glow--c', 'x', { duration: 2, ease: 'power3' });
    const glowY = gsap.quickTo('.hero__glow--c', 'y', { duration: 2, ease: 'power3' });
    hero.addEventListener('pointermove', (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      art(nx * 18); artY(ny * 14);
      glowX(nx * -80); glowY(ny * -60);
    });
  }

  /* ======================================================================
     SCROLL CHOREOGRAPHY
     ====================================================================== */
  function initScrollAnimations() {
    if (!animate) return;
    const mm = gsap.matchMedia();

    /* --- Hero exit: content drifts up and fades as you scroll away --- */
    gsap.to('.hero__inner', {
      yPercent: -14, opacity: 0.25, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });

    /* --- Word-split headings --- */
    $$('[data-split="words"]').forEach((el) => {
      const words = splitText(el, 'words');
      gsap.from(words, {
        y: '0.7em', opacity: 0, rotate: 3, duration: 1.1, ease: 'expo.out', stagger: 0.07,
        scrollTrigger: { trigger: el, start: 'top 86%' },
      });
    });

    /* --- Generic reveals (batched for performance) --- */
    gsap.set('[data-reveal]', { y: 50, opacity: 0 });
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.12, overwrite: true }),
    });

    /* --- Silver Jubilee: counter, parallax, timeline --- */
    const count = $('.jubilee__count');
    if (count) {
      const obj = { v: 0 };
      count.textContent = bn(0);
      gsap.to(obj, {
        v: 25, duration: 2.4, ease: 'power3.out',
        scrollTrigger: { trigger: count, start: 'top 80%', once: true },
        onUpdate: () => { count.textContent = bn(Math.round(obj.v)); },
      });
      gsap.from('.jubilee__num', {
        y: 80, opacity: 0, duration: 1.4, ease: 'expo.out',
        scrollTrigger: { trigger: '.jubilee__num', start: 'top 85%' },
      });
    }
    gsap.from('.jubilee__poster', {
      clipPath: 'inset(100% 0% 0% 0%)', duration: 1.6, ease: 'power4.inOut', clearProps: 'clipPath',
      scrollTrigger: { trigger: '.jubilee__media', start: 'top 85%' },
    });
    gsap.from('.jubilee__circle', {
      scale: 0.4, opacity: 0, duration: 1.6, ease: 'expo.out', delay: 0.3,
      scrollTrigger: { trigger: '.jubilee__media', start: 'top 85%' },
    });
    mm.add('(min-width: 761px)', () => {
      gsap.fromTo('.jubilee__poster img', { yPercent: -6, scale: 1.12 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: '.jubilee__media', start: 'top bottom', end: 'bottom top', scrub: true },
      });
      gsap.fromTo('.jubilee__circle', { y: 80 }, {
        y: -80, ease: 'none',
        scrollTrigger: { trigger: '.jubilee__media', start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
    gsap.fromTo('.timeline__line span', { scaleX: 0 }, {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: '.timeline', start: 'top 92%', end: 'top 45%', scrub: true },
    });
    gsap.from('.timeline__ticks i', {
      scaleY: 0, transformOrigin: 'top', duration: 0.6, ease: 'expo.out', stagger: 0.03,
      scrollTrigger: { trigger: '.timeline', start: 'top 85%' },
    });

    /* --- Featured artist --- */
    mm.add('(min-width: 761px)', () => {
      gsap.fromTo('.artist__bigname', { xPercent: 0 }, {
        xPercent: -35, ease: 'none',
        scrollTrigger: { trigger: '.artist', start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
    gsap.fromTo('.artist__mask',
      { clipPath: 'inset(14% 16% 14% 16% round 240px)' },
      { clipPath: 'inset(0% 0% 0% 0% round 28px)', ease: 'none',
        scrollTrigger: { trigger: '.artist__portrait', start: 'top 92%', end: 'center 55%', scrub: true } });
    gsap.fromTo('.artist__mask-inner', { scale: 1.35 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.artist__portrait', start: 'top bottom', end: 'bottom 40%', scrub: true },
    });
    const artistTl = gsap.timeline({ scrollTrigger: { trigger: '.artist__name', start: 'top 82%' } });
    artistTl
      .from('.artist__honor', { y: 20, opacity: 0, duration: 1, ease: 'expo.out' })
      .fromTo('.artist__line',
        { clipPath: 'inset(0% 100% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power4.inOut', stagger: 0.18, clearProps: 'clipPath' }, 0.1)
      .from('.artist__line > span', { xPercent: -12, duration: 1.6, ease: 'expo.out', stagger: 0.18 }, 0.1);
    gsap.from('.tickets__list li', {
      y: 24, opacity: 0, duration: 0.8, ease: 'back.out(2)', stagger: 0.07,
      scrollTrigger: { trigger: '.tickets', start: 'top 90%' },
    });

    /* --- Workshop: horizontal storytelling on wide screens --- */
    mm.add('(min-width: 1024px)', () => {
      const section = $('.workshop');
      const track = $('.workshop__track');
      section.classList.add('is-hscroll');
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

      const hTween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => '+=' + distance(),
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
      gsap.fromTo('.workshop__progress span', { scaleX: 0 }, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: () => '+=' + distance(), scrub: true, invalidateOnRefresh: true },
      });
      gsap.to('.workshop__ghost', {
        xPercent: -30, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: () => '+=' + distance(), scrub: true, invalidateOnRefresh: true },
      });
      // Card contents slide in as each card travels into view
      // (card transforms stay free for the pointer tilt effect)
      $$('.ws-card, .ws-cta').forEach((card) => {
        const parts = $$(':scope > :not(.ws-cta__stamp)', card);
        gsap.fromTo(parts, { x: 90, opacity: 0 }, {
          x: 0, opacity: 1, ease: 'none', stagger: 0.05,
          scrollTrigger: { trigger: card, containerAnimation: hTween, start: 'left 98%', end: 'left 50%', scrub: true },
        });
      });

      return () => {
        section.classList.remove('is-hscroll');
        gsap.set(track, { clearProps: 'transform' });
      };
    });
    mm.add('(max-width: 1023px)', () => {
      gsap.from('.ws-card, .ws-cta', {
        y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12,
        scrollTrigger: { trigger: '.workshop__track', start: 'top 75%' },
      });
    });
    gsap.from('.ws-intro__by, .ws-intro__date', {
      y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.12,
      scrollTrigger: { trigger: '.ws-intro', start: 'top 75%' },
    });

    /* --- Collaborators --- */
    gsap.from('.org', {
      y: 80, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: 0.15,
      scrollTrigger: { trigger: '.collab__grid', start: 'top 82%' },
    });
    gsap.from('.org__logo', {
      scale: 0.5, rotate: -50, duration: 1.4, ease: 'back.out(1.6)', stagger: 0.15,
      scrollTrigger: { trigger: '.collab__grid', start: 'top 82%' },
    });

    /* --- Invitation: words light up as you read --- */
    const inviteText = $('[data-split="scrub"]');
    if (inviteText) {
      const words = splitText(inviteText, 'words');
      gsap.fromTo(words, { opacity: 0.14 }, {
        opacity: 1, ease: 'none', stagger: 0.1,
        scrollTrigger: { trigger: inviteText, start: 'top 78%', end: 'bottom 45%', scrub: true },
      });
    }
    gsap.from('.invite__mark', {
      scale: 0.3, opacity: 0, rotate: -20, duration: 1.6, ease: 'expo.out',
      scrollTrigger: { trigger: '.invite', start: 'top 70%' },
    });

    /* --- Details --- */
    gsap.from('.cd', {
      y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08,
      scrollTrigger: { trigger: '.countdown', start: 'top 90%' },
    });
    $$('.rows').forEach((rows) => {
      gsap.from($$('.row', rows), {
        x: -24, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06,
        scrollTrigger: { trigger: rows, start: 'top 85%' },
      });
    });

    /* --- Footer closing animation --- */
    const footerChars = splitText($('.footer__word'), 'chars');
    const footTl = gsap.timeline({ scrollTrigger: { trigger: '.footer__grid', start: 'top 80%' } });
    footTl
      .from('.footer__logo', { rotate: -180, scale: 0, duration: 1.6, ease: 'expo.out' })
      .from('.footer__brand > *:not(.footer__logo), .footer__col', { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08 }, 0.15);
    gsap.from(footerChars, {
      yPercent: 70, opacity: 0, rotate: 8, duration: 1.6, ease: 'expo.out', stagger: 0.08,
      scrollTrigger: { trigger: '.footer__word', start: 'top 95%' },
    });
    gsap.from('.footer__bottom', {
      opacity: 0, y: 20, duration: 1,
      scrollTrigger: { trigger: '.footer__bottom', start: 'top 100%' },
    });
  }

  /* ======================================================================
     DECOR: particles + timeline ticks
     ====================================================================== */
  function initParticles() {
    if (reduceMotion) return;
    const colors = ['#ffd93b', '#ff5aa8', '#ffffff', '#f5a623'];
    const isSmall = window.innerWidth < 760;
    $$('[data-particles]').forEach((wrap) => {
      const n = Math.round(Number(wrap.dataset.particles) * (isSmall ? 0.5 : 1));
      const frag = document.createDocumentFragment();
      for (let i = 0; i < n; i++) {
        const p = document.createElement('span');
        p.className = 'particle';
        const s = 1.5 + Math.random() * 3.5;
        p.style.cssText = [
          `--x:${(Math.random() * 100).toFixed(2)}%`,
          `--s:${s.toFixed(1)}px`,
          `--d:${(12 + Math.random() * 16).toFixed(1)}s`,
          `--delay:${(-Math.random() * 28).toFixed(1)}s`,
          `--drift:${(Math.random() * 120 - 60).toFixed(0)}px`,
          `--o:${(0.35 + Math.random() * 0.55).toFixed(2)}`,
          `--c:${colors[i % colors.length]}`,
        ].join(';');
        frag.appendChild(p);
      }
      wrap.appendChild(frag);
    });
  }

  function initTimelineTicks() {
    const wrap = $('#timelineTicks');
    if (!wrap) return;
    for (let i = 1; i <= 25; i++) {
      const t = document.createElement('i');
      if (i === 1 || i % 5 === 0) {
        t.className = 'is-major';
        t.dataset.label = bn(i, 2);
      }
      wrap.appendChild(t);
    }
  }

  /* ======================================================================
     NAVIGATION
     ====================================================================== */
  function initNav() {
    const nav = $('#nav');
    let lastY = window.scrollY;
    let ticking = false;
    const bar = $('#progressBar');

    const update = () => {
      const y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 40);
      const menuOpen = $('#mobileMenu').classList.contains('is-open');
      if (!menuOpen) nav.classList.toggle('is-hidden', y > lastY && y > 400);
      lastY = y;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();

    // Active section highlight
    const links = $$('[data-nav]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.classList.toggle('is-active', a.dataset.nav === entry.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach((a) => { const s = $('#' + a.dataset.nav); if (s) io.observe(s); });
  }

  function initMobileMenu() {
    const burger = $('#burger');
    const menu = $('#mobileMenu');
    const setOpen = (open) => {
      menu.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন');
      menu.setAttribute('aria-hidden', String(!open));
      menu.inert = !open;
      $('#nav').classList.remove('is-hidden');
      lockScroll(open);
    };
    burger.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
    menu.addEventListener('click', (e) => {
      if (e.target.closest('a[href^="#"]') || e.target.closest('[data-open-register]')) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setOpen(false); burger.focus(); }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
  }

  function initAnchors() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (href === '#' || a.hasAttribute('data-social') || a.classList.contains('skip-link')) return;
      const target = href === '#top' ? document.body : $(href);
      if (!target) return;
      e.preventDefault();
      // allow the mobile menu to release the scroll lock first
      requestAnimationFrame(() => scrollToTarget(href === '#top' ? '#top' : target));
      if (history.replaceState) history.replaceState(null, '', href === '#top' ? location.pathname : href);
    });
  }

  /* ======================================================================
     POINTER INTERACTIONS: cursor · magnetic · tilt
     ====================================================================== */
  function initCursor() {
    if (!finePointer || reduceMotion) return;
    const cursor = $('#cursor');
    const ring = $('.cursor__ring', cursor);
    const dot = $('.cursor__dot', cursor);
    root.classList.add('has-cursor');

    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      cursor.classList.remove('is-hidden');
    }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));

    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();

    document.addEventListener('pointerover', (e) => {
      const view = e.target.closest('[data-cursor="view"]');
      const hover = e.target.closest('a, button, label, input, textarea, [data-tilt]');
      cursor.classList.toggle('is-view', !!view);
      cursor.classList.toggle('is-hover', !view && !!hover);
    });
  }

  function initMagnetic() {
    if (!finePointer || reduceMotion) return;
    $$('[data-magnetic]').forEach((el) => {
      const strength = 0.32;
      // transition is only added on hover so it never smooths GSAP's entrance tweens
      el.addEventListener('pointerenter', () => {
        el.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1), color .45s, background-color .45s, border-color .45s, box-shadow .45s';
      });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  function initTilt() {
    if (!finePointer || reduceMotion) return;
    $$('[data-tilt]').forEach((card) => {
      card.addEventListener('pointerenter', () => { card.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1), background-color .5s'; });
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', `${px * 100}%`);
        card.style.setProperty('--my', `${py * 100}%`);
        card.style.transform = `perspective(1000px) rotateX(${(0.5 - py) * 6}deg) rotateY(${(px - 0.5) * 8}deg)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  /* ======================================================================
     DIALOGS: poster lightbox
     ====================================================================== */
  function openDialog(dlg) {
    if (!dlg || dlg.open) return;
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
    lockScroll(true);
  }
  function closeDialog(dlg) {
    if (!dlg) return;
    if (typeof dlg.close === 'function') dlg.close();
    else dlg.removeAttribute('open');
  }

  function initDialogs() {
    $$('dialog').forEach((dlg) => {
      dlg.addEventListener('close', () => lockScroll(false));
      dlg.addEventListener('click', (e) => {
        if (e.target.closest('[data-close]')) closeDialog(dlg);
        // click on backdrop (outside card)
        if (e.target === dlg && !dlg.classList.contains('lightbox')) closeDialog(dlg);
        if (dlg.classList.contains('lightbox') && e.target.tagName !== 'IMG') closeDialog(dlg);
      });
    });

    $$('[data-lightbox]').forEach((btn) => btn.addEventListener('click', () => openDialog($('#lightbox'))));
  }

  /* ======================================================================
     MISC: countdown · social links · toast
     ====================================================================== */
  function initCountdown() {
    const box = $('#countdown');
    if (!box) return;
    const els = { d: $('[data-cd="d"]', box), h: $('[data-cd="h"]', box), m: $('[data-cd="m"]', box), s: $('[data-cd="s"]', box) };
    const tick = () => {
      const diff = CONFIG.eventStart - Date.now();
      if (diff <= 0) {
        $('.countdown__label', box).textContent = 'আবৃত্তি সন্ধ্যা সম্পন্ন — সকলকে ধন্যবাদ';
        $('.countdown__boxes', box).hidden = true;
        clearInterval(timer);
        return;
      }
      const s = Math.floor(diff / 1000);
      els.d.textContent = bn(Math.floor(s / 86400), 2);
      els.h.textContent = bn(Math.floor((s % 86400) / 3600), 2);
      els.m.textContent = bn(Math.floor((s % 3600) / 60), 2);
      els.s.textContent = bn(s % 60, 2);
    };
    const timer = setInterval(tick, 1000);
    tick();
  }

  function initSocial() {
    $$('[data-social]').forEach((a) => {
      const url = CONFIG.socialLinks[a.dataset.social];
      if (url) {
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      } else {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          toast('সোশ্যাল মিডিয়া লিঙ্ক শীঘ্রই যুক্ত হবে।');
        });
      }
    });
  }

  let toastTimer;
  function toast(text) {
    const t = $('#toast');
    t.textContent = text;
    t.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-visible'), 3200);
  }

  /* ======================================================================
     BOOT
     ====================================================================== */
  function boot() {
    initTimelineTicks();
    initParticles();
    initSmoothScroll();
    initNav();
    initMobileMenu();
    initAnchors();
    initCursor();
    initMagnetic();
    initTilt();
    initDialogs();
    initCountdown();
    initSocial();

    const heroTl = buildHeroIntro();
    initScrollAnimations();
    initHeroParallax();

    runLoader().then(() => {
      if (heroTl) heroTl.play();
      if (hasST) ScrollTrigger.refresh();
    });

    // Recalculate trigger positions once fonts/images settle
    if (hasST) {
      if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
      window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
