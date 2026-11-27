gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============ Lenis Smooth Scroll Setup (Natural Momentum & Friction) ============ */
let lenis = null;
if (!reduceMotion && typeof Lenis !== 'undefined') {
  lenis = new Lenis({
    lerp: 0.075, // Fluid momentum damping: glides and decelerates naturally based on scroll velocity
    wheelMultiplier: 1.05, // Smooth, responsive velocity accumulation
    touchMultiplier: 1.2,
    smoothWheel: true,
    syncTouch: false,
    infinite: false,
    autoResize: true
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
}

/* Helper to smooth scroll to an element or position */
function scrollToSection(target, offset = 0) {
  if (lenis) {
    lenis.scrollTo(target, {
      offset: offset,
      duration: 1.35,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    });
  } else {
    if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior: reduceMotion ? 'auto' : 'smooth' });
    } else {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el) {
        const y = el.getBoundingClientRect().top + window.pageYOffset + offset;
        window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    }
  }
}

/* ============ Text splitting for line/word reveals ============ */
function wrapLines(el) {
  const html = el.innerHTML;
  const parts = html.split(/<br\s*\/?>/i);
  el.innerHTML = parts.map(p => `<span class="line"><span>${p.trim()}</span></span>`).join('');
}

function initTextSplit() {
  document.querySelectorAll('[data-split-lines]').forEach(wrapLines);
  gsap.set('.chapter-title .line span', {
    yPercent: 110
  });
  gsap.set('.hero-name .word-mask span', {
    yPercent: 125,
    opacity: 0,
    rotateX: 14,
    transformOrigin: '50% 100%'
  });
}
initTextSplit();

/* ============ Hero entrance animation ============ */
let hasPageIntroRun = false;

function pageIntro() {
  if (hasPageIntroRun) return;
  hasPageIntroRun = true;

  const tl = gsap.timeline({ delay: reduceMotion ? 0 : 0.08 });
  tl.from('header', { y: -26, opacity: 0, duration: 0.6, ease: 'power3.out' }, 0);

  document.querySelectorAll('#hero .eyebrow').forEach(el => {
    tl.from(el, { y: 18, opacity: 0, duration: 0.5, ease: 'power3.out' }, 0.12);
  });

  // Hero name: cinematic word-by-word reveal
  tl.to('.hero-name .word-mask span', {
    yPercent: 0,
    opacity: 1,
    rotateX: 0,
    duration: 0.95,
    ease: 'power3.out',
    stagger: 0.2
  }, 0.22);

  tl.from('#hero .hero-role', { y: 16, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.45')
    .from('.hero-actions .btn', { y: 14, opacity: 0, duration: 0.45, stagger: 0.08, ease: 'power3.out' }, '-=0.35')
    .from('.scroll-cue', { opacity: 0, duration: 0.6 }, '-=0.2');
}

/* ============ Section 03: Horizontal Pinned Projects Reel ============ */
function initProjectsReel() {
  const projectsSection = document.getElementById('projects');
  const track = document.getElementById('projectsTrack');
  const fill = document.getElementById('projectsProgressFill');
  const ticks = document.querySelectorAll('.projects-ticks .tick');
  const viewport = document.querySelector('.projects-viewport');

  if (!projectsSection || !track) return;

  const isDesktop = window.innerWidth > 768;

  if (isDesktop && !reduceMotion) {
    // Calculates the exact horizontal translation needed so that the last card ends up centered in the viewport
    const getScrollAmount = () => {
      const panels = track.querySelectorAll('.project-panel');
      if (!panels.length) return track.scrollWidth - window.innerWidth;
      const lastPanel = panels[panels.length - 1];

      const viewportStyle = window.getComputedStyle(viewport);
      const paddingLeft = parseFloat(viewportStyle.paddingLeft) || 0;

      // Center of last panel relative to track
      const lastPanelCenter = lastPanel.offsetLeft + (lastPanel.offsetWidth / 2);
      const viewportCenter = window.innerWidth / 2;

      // Distance to bring lastPanelCenter to viewportCenter
      const distance = lastPanelCenter + paddingLeft - viewportCenter;
      return Math.max(0, distance);
    };

    // Calculate progress (0 to 1) to bring any specific panel to center
    const getPanelProgress = (index) => {
      const panels = track.querySelectorAll('.project-panel');
      if (!panels.length) return index / 3;
      if (index === 0) return 0;
      if (index === panels.length - 1) return 1;

      const totalDistance = getScrollAmount();
      if (totalDistance <= 0) return index / (panels.length - 1);

      const panel = panels[index];
      const viewportStyle = window.getComputedStyle(viewport);
      const paddingLeft = parseFloat(viewportStyle.paddingLeft) || 0;
      const panelCenter = panel.offsetLeft + (panel.offsetWidth / 2);
      const viewportCenter = window.innerWidth / 2;
      const panelDistance = panelCenter + paddingLeft - viewportCenter;

      return Math.max(0, Math.min(1, panelDistance / totalDistance));
    };

    const pinTween = gsap.to(track, {
      x: () => -getScrollAmount(),
      ease: 'none',
      scrollTrigger: {
        id: 'projectsPinTrigger',
        trigger: '#projects',
        pin: true,
        start: 'top top',
        end: () => `+=${getScrollAmount()}`,
        scrub: 0.8, // Fluid inertia sync with Lenis
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;
          if (fill) fill.style.width = `${p * 100}%`;

          // Highlight the tick for whichever panel is closest to viewport center
          const panels = track.querySelectorAll('.project-panel');
          const viewportStyle = window.getComputedStyle(viewport);
          const paddingLeft = parseFloat(viewportStyle.paddingLeft) || 0;
          const viewportCenter = window.innerWidth / 2;
          const currentDistance = p * getScrollAmount();

          let closestIndex = 0;
          let minDiff = Infinity;

          panels.forEach((panel, i) => {
            const panelCenterInViewport = paddingLeft - currentDistance + panel.offsetLeft + (panel.offsetWidth / 2);
            const diff = Math.abs(panelCenterInViewport - viewportCenter);
            if (diff < minDiff) {
              minDiff = diff;
              closestIndex = i;
            }
          });

          ticks.forEach((tick, i) => {
            tick.classList.toggle('active', i === closestIndex);
          });
        }
      }
    });

    // Clicking tick markers jumps smoothly to that panel's centered position
    ticks.forEach((tick, i) => {
      tick.addEventListener('click', () => {
        const st = ScrollTrigger.getById('projectsPinTrigger');
        if (st) {
          const targetProgress = getPanelProgress(i);
          const target = st.start + (st.end - st.start) * targetProgress;
          scrollToSection(target, 0);
        }
      });
    });
  } else if (viewport) {
    // Mobile / touch fallback: CSS scroll-snap handles swipe; update indicator via scroll listener
    viewport.addEventListener('scroll', () => {
      const max = viewport.scrollWidth - viewport.clientWidth;
      const p = max > 0 ? viewport.scrollLeft / max : 0;
      if (fill) fill.style.width = `${p * 100}%`;
      const activeIndex = Math.min(3, Math.floor(p * 4));
      ticks.forEach((tick, i) => {
        tick.classList.toggle('active', i === activeIndex);
      });
    }, { passive: true });

    ticks.forEach((tick, i) => {
      tick.addEventListener('click', () => {
        const panels = document.querySelectorAll('.project-panel');
        if (panels[i]) {
          panels[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      });
    });
  }
}

/* ============ Desktop: Natural Section Animations & Transitions ============ */
function initSectionPinning() {
  if (reduceMotion) {
    initProjectsReel();
    initMobileSectionAnimations();
    return;
  }

  // Chapter header reveals on approach
  gsap.utils.toArray('.chapter').forEach(ch => {
    const num = ch.querySelector('.chapter-num');
    const lines = ch.querySelectorAll('.chapter-title .line span');
    const rule = ch.querySelector('.chapter-rule');
    const tl = gsap.timeline({ scrollTrigger: { trigger: ch, start: 'top 85%', once: true } });
    if (num) tl.fromTo(num, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
    if (lines.length) tl.to(lines, { yPercent: 0, duration: 0.7, ease: 'power4.out', stagger: 0.08 }, '-=0.2');
    if (rule) tl.to(rule, { scaleX: 1, duration: 0.7, ease: 'power3.out' }, '-=0.25');
  });

  // 1. Hero: Soft parallax depth
  const hero = document.getElementById('hero');
  if (hero) {
    gsap.to('#hero .hero-inner', {
      y: -30, opacity: 0.85, ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.4
      }
    });
    gsap.to('#hero .scroll-cue', {
      opacity: 0, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: '+=100', scrub: true }
    });
  }

  // 2. Profile: Telemetry odometer count-up + lede reveal (plays to 100% completion)
  const profile = document.getElementById('profile');
  if (profile) {
    const statCounters = profile.querySelectorAll('.stat-counter');
    ScrollTrigger.create({
      trigger: profile,
      start: 'top 78%',
      once: true,
      onEnter: () => {
        gsap.fromTo('#profile .lede', { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, ease: 'power3.out' });
        gsap.fromTo('#profile .stat-row', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, stagger: 0.08, ease: 'power3.out', delay: 0.1 });
        statCounters.forEach(el => {
          const target = parseFloat(el.dataset.target) || 0;
          const start = parseFloat(el.dataset.start) || 0;
          const decimals = parseInt(el.dataset.decimals, 10) || 0;
          const pad = parseInt(el.dataset.pad, 10) || 0;
          const suffix = el.dataset.suffix || '';
          const obj = { val: start };
          gsap.to(obj, {
            val: target,
            duration: 1.4,
            ease: 'power2.out',
            onUpdate: () => {
              let formatted = decimals > 0 ? obj.val.toFixed(decimals) : Math.round(obj.val).toString();
              if (pad > 0 && decimals === 0) formatted = formatted.padStart(pad, '0');
              el.textContent = formatted + suffix;
            }
          });
        });
      }
    });
  }

  // 3. Experience: Timeline glowing stroke unroll + log entry illumination
  const exp = document.getElementById('experience');
  if (exp) {
    const timelineFill = document.getElementById('timelineFill');
    if (timelineFill) {
      gsap.fromTo(timelineFill, { height: '0%' }, {
        height: '100%', ease: 'none',
        scrollTrigger: {
          trigger: '#experience .timeline-track',
          start: 'top 75%',
          end: 'bottom 85%',
          scrub: 0.4
        }
      });
    }

    gsap.fromTo('#experience .log-entry', 
      { opacity: 0, y: 24 }, 
      {
        opacity: 1, y: 0, duration: 0.65, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: '#experience .timeline-track', start: 'top 80%', once: true }
      }
    );
  }

  // 4. Section 03: Pinned Horizontal Projects Reel (in exact document order)
  initProjectsReel();

  // 5. Achievements: 3D perspective tilt cards
  const ach = document.getElementById('achievements');
  if (ach) {
    gsap.fromTo('#achievements .ach-row',
      { rotateX: -14, transformPerspective: 800, opacity: 0, y: 24 },
      {
        rotateX: 0, opacity: 1, y: 0, duration: 0.65, stagger: 0.08, ease: 'power3.out',
        scrollTrigger: { trigger: '#achievements', start: 'top 78%', once: true }
      }
    );
  }

  // 6. Skills: Snappy spring chip pop-in
  const skills = document.getElementById('skills');
  if (skills) {
    gsap.fromTo('#skills .skill-row',
      { opacity: 0, y: 18 },
      {
        opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: 'power3.out',
        scrollTrigger: { trigger: '#skills', start: 'top 80%', once: true }
      }
    );
    gsap.fromTo('#skills .skill-chips .skill-chip',
      { scale: 0.82, opacity: 0 },
      {
        scale: 1, opacity: 1, duration: 0.45, stagger: 0.015, ease: 'back.out(1.6)',
        scrollTrigger: { trigger: '#skills', start: 'top 78%', once: true }
      }
    );
  }

  // 7. Certifications: Sleek credential illumination (100% finished on entrance)
  const certs = document.getElementById('certifications');
  if (certs) {
    gsap.fromTo('#certifications .cert-row',
      { x: -20, opacity: 0 },
      {
        x: 0, opacity: 1, duration: 0.5, stagger: 0.04, ease: 'power2.out',
        scrollTrigger: { trigger: '#certifications', start: 'top 78%', once: true }
      }
    );
  }

  // 8. Contact: Full entrance illumination
  const contact = document.getElementById('contact');
  if (contact) {
    gsap.fromTo('#contact .contact-cell',
      { y: 26, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: '#contact .contact-grid', start: 'top 85%', once: true }
      }
    );
  }

  // Ambient parallax layers
  const stripes = document.getElementById('heroStripes');
  const grainient = document.getElementById('heroGrainient');
  if (stripes) {
    gsap.to(stripes, {
      y: 120, x: 60, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
    });
  }
  if (grainient) {
    gsap.to(grainient, {
      opacity: 0.2, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 0.5 }
    });
  }
}

/* ============ Mobile / Reduced-Motion Fallback Animations ============ */
function initMobileSectionAnimations() {
  gsap.utils.toArray('.chapter').forEach(ch => {
    const num = ch.querySelector('.chapter-num');
    const lines = ch.querySelectorAll('.chapter-title .line span');
    const rule = ch.querySelector('.chapter-rule');
    const tl = gsap.timeline({ scrollTrigger: { trigger: ch, start: 'top 85%' } });
    if (num) tl.from(num, { y: 16, opacity: 0, duration: 0.5, ease: 'power3.out' });
    if (lines.length) tl.to(lines, { yPercent: 0, duration: 0.7, ease: 'power4.out', stagger: 0.06 }, '-=0.25');
    if (rule) tl.to(rule, { scaleX: 1, duration: 0.7, ease: 'power3.out' }, '-=0.3');
  });

  gsap.utils.toArray('.stat-counter').forEach(el => {
    const target = parseFloat(el.dataset.target) || 0;
    const start = parseFloat(el.dataset.start) || 0;
    const decimals = parseInt(el.dataset.decimals, 10) || 0;
    const pad = parseInt(el.dataset.pad, 10) || 0;
    const suffix = el.dataset.suffix || '';
    const obj = { val: start };

    gsap.to(obj, {
      val: target,
      duration: 1.5,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      onUpdate: () => {
        let formatted = decimals > 0 ? obj.val.toFixed(decimals) : Math.round(obj.val).toString();
        if (pad > 0 && decimals === 0) formatted = formatted.padStart(pad, '0');
        el.textContent = formatted + suffix;
      }
    });
  });

  const timelineFill = document.getElementById('timelineFill');
  if (timelineFill) {
    gsap.fromTo(timelineFill, { height: '0%' }, {
      height: '100%', ease: 'none',
      scrollTrigger: { trigger: '#experience', start: 'top 70%', end: 'bottom 80%', scrub: 0.4 }
    });
  }

  gsap.from('#achievements .ach-row', {
    y: 20, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out',
    scrollTrigger: { trigger: '#achievements', start: 'top 88%', once: true }
  });

  gsap.from('#skills .skill-chips .skill-chip', {
    scale: 0.85, opacity: 0, duration: 0.4, stagger: 0.03, ease: 'back.out(1.7)',
    scrollTrigger: { trigger: '#skills', start: 'top 88%', once: true }
  });

  gsap.from('#certifications .cert-row', {
    x: -16, opacity: 0, duration: 0.45, stagger: 0.03, ease: 'power2.out',
    scrollTrigger: { trigger: '#certifications', start: 'top 88%', once: true }
  });

  gsap.from('#contact .contact-cell', {
    y: 24, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out',
    scrollTrigger: { trigger: '#contact .contact-grid', start: 'top 88%', once: true }
  });
}

/* ============ Overall Scroll Progress Bar + Back To Top ============ */
function initScrollUI() {
  const fill = document.getElementById('scanFill');
  const backTop = document.getElementById('backTop');

  if (fill) {
    gsap.set(fill, { scaleX: 0, transformOrigin: 'left' });
    gsap.to(fill, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.2
      }
    });
  }

  if (backTop) {
    const footer = document.querySelector('footer.site-footer, footer');
    ScrollTrigger.create({
      start: 500,
      onUpdate: (self) => {
        if (footer) {
          const footerRect = footer.getBoundingClientRect();
          // Hide floating backTop when footer action pill is in view or near bottom
          if (footerRect.top < window.innerHeight - 80) {
            backTop.classList.remove('show');
            return;
          }
        }
        backTop.classList.toggle('show', window.scrollY > 500);
      }
    });
    backTop.addEventListener('click', () => scrollToSection(0, 0));
  }
}

/* ============ Follow-Scroll SVG Line ============ */
function initLinePath() {
  if (window.innerWidth <= 1000) return;
  const path = document.getElementById('scrollLinePath');
  if (!path) return;
  const len = path.getTotalLength();
  path.style.strokeDasharray = len;
  path.style.strokeDashoffset = len;
  gsap.to(path, {
    strokeDashoffset: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.4
    }
  });
}

/* ============ Navigation & Active Section Tracking ============ */
function initNav() {
  const menuBtn = document.getElementById('menuBtn');
  const mobileNav = document.getElementById('mobileNav');
  const desktopNavLinks = document.querySelectorAll('header nav.tabs a');
  const mobileNavLinks = document.querySelectorAll('#mobileNav a');
  const allNavLinks = [...desktopNavLinks, ...mobileNavLinks];

  let menuOpen = false;

  function toggleMenu(state) {
    menuOpen = (typeof state === 'boolean') ? state : !menuOpen;
    if (!menuBtn || !mobileNav) return;
    menuBtn.setAttribute('aria-expanded', menuOpen);

    if (menuOpen) {
      mobileNav.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (lenis) lenis.stop();
      menuBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
      gsap.to(mobileNav, { yPercent: 100, duration: 0.5, ease: 'power4.inOut' });
      gsap.to(mobileNavLinks, { opacity: 1, y: 0, duration: 0.45, stagger: 0.05, ease: 'power3.out', delay: 0.1 });
    } else {
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
      if (lenis) lenis.start();
      menuBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`;
      gsap.to(mobileNav, { yPercent: 0, duration: 0.4, ease: 'power4.inOut' });
      gsap.set(mobileNavLinks, { opacity: 0, y: 25 });
    }
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', () => toggleMenu());
  }

  // Intercept anchor and in-page hash clicks for smooth scrolling and auto-close mobile nav
  document.querySelectorAll('a[href]').forEach(a => {
    const rawHref = a.getAttribute('href');
    if (!rawHref) return;

    // Check for in-page hash (#section or index.html#section)
    let targetId = null;
    if (rawHref.startsWith('#')) {
      targetId = rawHref;
    } else if (rawHref.includes('#') && (rawHref.startsWith('index.html#') || rawHref.startsWith('./index.html#'))) {
      targetId = rawHref.substring(rawHref.indexOf('#'));
    }

    if (targetId && targetId !== '#') {
      a.addEventListener('click', (e) => {
        const targetEl = document.querySelector(targetId);
        if (targetEl || targetId === '#hero') {
          e.preventDefault();
          toggleMenu(false);
          if (history.pushState) {
            history.pushState(null, '', targetId);
          }
          if (targetId === '#hero') {
            scrollToSection(0, 0);
          } else {
            scrollToSection(targetEl, 0);
          }
        }
      });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) toggleMenu(false);
  });

  // Active section tracking via ScrollTrigger
  const sectionMapping = [
    { trigger: '#hero', href: '#hero' },
    { trigger: '#profile', href: '#profile' },
    { trigger: '#experience', href: '#experience' },
    { trigger: '#projects', href: '#projects' },
    { trigger: '#achievements', href: '#projects' },
    { trigger: '#skills', href: '#skills' },
    { trigger: '#certifications', href: '#skills' },
    { trigger: '#contact', href: '#contact' }
  ];

  sectionMapping.forEach(({ trigger, href }) => {
    const el = document.querySelector(trigger);
    if (!el) return;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 50%',
      end: 'bottom 50%',
      onEnter: () => setActive(href),
      onEnterBack: () => setActive(href)
    });
  });

  function setActive(activeHref) {
    allNavLinks.forEach(link => {
      const isTarget = link.getAttribute('href') === activeHref;
      link.classList.toggle('active', isTarget);
    });
  }
}

/* ============ Project Detail Modal ============ */
function initModal() {
  const overlay = document.getElementById('modalOverlay');
  if (!overlay) return;

  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const modalStack = document.getElementById('modalStack');
  const modalGithubLink = document.getElementById('modalGithubLink');
  const closeBtn = document.getElementById('modalClose');
  let lastFocused = null;

  function openModal(card) {
    lastFocused = document.activeElement;
    if (modalTitle) modalTitle.textContent = card.dataset.title || '';
    if (modalBody) modalBody.textContent = card.dataset.body || '';

    if (modalStack) {
      modalStack.innerHTML = (card.dataset.stack || '')
        .split(',')
        .filter(Boolean)
        .map(s => `<span class="stack-chip">${s.trim()}</span>`)
        .join('');
    }

    if (modalGithubLink) {
      if (card.dataset.url) {
        modalGithubLink.href = card.dataset.url;
        modalGithubLink.style.display = 'inline-flex';
      } else {
        modalGithubLink.style.display = 'none';
      }
    }

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
    gsap.fromTo('#modalBox', { scale: 0.94, y: 20 }, { scale: 1, y: 0, duration: 0.35, ease: 'power3.out' });
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  // Bind to cards and deep dive buttons
  document.querySelectorAll('.project-card').forEach(card => {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');

    card.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      openModal(card);
    });

    card.addEventListener('keydown', (e) => {
      if (e.target.closest('a')) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(card);
      }
    });

    const btn = card.querySelector('.btn-details');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openModal(card);
      });
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
  });
}

/* ============ WebGL2 Grainient Fluid Shader Hero ============ */
let heroGrainientInstance = null;

const GRAINIENT_DARK_CONFIG = {
  colors: ['#000000', '#1c0505', '#570d08', '#99110b', '#E8271A', '#ff6b55'],
  lightMode: false
};

const GRAINIENT_LIGHT_CONFIG = {
  colors: ['#FFF0E6', '#FFB885', '#FF8C42', '#FF6B35', '#F95722', '#E8271A'],
  lightMode: false
};

function getGrainientConfig(theme) {
  const currentTheme = theme || document.documentElement.getAttribute('data-theme') || 'dark';
  return currentTheme === 'light' ? GRAINIENT_LIGHT_CONFIG : GRAINIENT_DARK_CONFIG;
}

function initHeroGrainient() {
  const container = document.getElementById('heroGrainient');
  if (!container || typeof initGrainient !== 'function') return null;

  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const cfg = getGrainientConfig(currentTheme);

  heroGrainientInstance = initGrainient(container, {
    colors: cfg.colors,
    lightMode: cfg.lightMode,
    type: 'linear',
    angle: 55,
    flow: 0.8,
    silk: 0.4,
    grainAmount: 0,
    grainSize: 1.0,
    grainAnimated: false,
    speed: 0.9,
    interactive: true,
    clickSwirl: true,
    intro: true
  });

  window.heroGrainientInstance = heroGrainientInstance;
  return heroGrainientInstance;
}

// Seamlessly transition shader when theme changes
window.addEventListener('themechange', (e) => {
  const newTheme = e.detail && e.detail.theme;
  if (heroGrainientInstance && typeof heroGrainientInstance.update === 'function') {
    const cfg = getGrainientConfig(newTheme);
    heroGrainientInstance.update({
      colors: cfg.colors,
      lightMode: cfg.lightMode
    });
  }
});

/* ============ Custom Minimal Red Dot Cursor for Laptop Viewports ============ */
function initCustomCursor() {
  if (reduceMotion) return;

  const isLaptopOrDesktop = () => {
    return window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 769px)').matches;
  };

  // Remove any legacy ring element
  const oldRing = document.querySelector('.custom-cursor-ring');
  if (oldRing) oldRing.remove();

  let dot = document.querySelector('.custom-cursor-dot');
  if (!dot) {
    dot = document.createElement('div');
    dot.className = 'custom-cursor-dot';
    document.body.appendChild(dot);
  }

  const updateCursorAvailability = () => {
    if (isLaptopOrDesktop()) {
      document.body.classList.add('has-custom-cursor');
    } else {
      document.body.classList.remove('has-custom-cursor');
      gsap.set(dot, { opacity: 0 });
    }
  };

  updateCursorAvailability();
  window.addEventListener('resize', updateCursorAvailability);

  // Set initial position centered
  gsap.set(dot, { xPercent: -50, yPercent: -50, opacity: 0 });

  // Ultra-responsive GSAP quickTo setters for 60-120fps hardware-accelerated tracking
  const setDotX = gsap.quickTo(dot, 'x', { duration: 0.02, ease: 'none' });
  const setDotY = gsap.quickTo(dot, 'y', { duration: 0.02, ease: 'none' });

  let isVisible = false;
  let isOverInteractive = false;

  const onPointerMove = (e) => {
    if (!isLaptopOrDesktop()) return;

    if (!isVisible) {
      isVisible = true;
      if (!isOverInteractive) {
        gsap.to(dot, { opacity: 1, duration: 0.2, overwrite: 'auto' });
      }
    }

    setDotX(e.clientX);
    setDotY(e.clientY);
  };

  const onMouseLeave = () => {
    isVisible = false;
    gsap.to(dot, { opacity: 0, duration: 0.2, overwrite: 'auto' });
  };

  const onMouseEnter = () => {
    if (!isLaptopOrDesktop()) return;
    isVisible = true;
    if (!isOverInteractive) {
      gsap.to(dot, { opacity: 1, duration: 0.2, overwrite: 'auto' });
    }
  };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('mouseleave', onMouseLeave);
  document.addEventListener('mouseenter', onMouseEnter);

  // Interactive selector: links, buttons, cards, controls revert to normal hand pointing cursor
  const interactiveSelector = 'a, button, .btn, .project-card, .case, .tab, .case-link, .btn-details, .cert-verify-link, input, textarea, select, [role="button"], #backTop, .theme-toggle, #menuBtn, summary';

  document.addEventListener('mouseover', (e) => {
    if (!isLaptopOrDesktop()) return;
    const target = e.target.closest(interactiveSelector);
    if (target) {
      isOverInteractive = true;
      dot.classList.add('cursor-interactive');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (!isLaptopOrDesktop()) return;
    const target = e.target.closest(interactiveSelector);
    if (target) {
      isOverInteractive = false;
      dot.classList.remove('cursor-interactive');
    }
  });

  // Click feedback on background
  document.addEventListener('mousedown', () => {
    if (!isLaptopOrDesktop() || isOverInteractive) return;
    dot.classList.add('cursor-active');
  });

  document.addEventListener('mouseup', () => {
    if (!isLaptopOrDesktop()) return;
    dot.classList.remove('cursor-active');
  });
}

/* ============ Magnetic Buttons ============ */
function initMagneticButtons() {
  if (reduceMotion) return;
  document.querySelectorAll('.btn, #backTop, #footerActionPill, .footer-cta-btn, .case-link').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      gsap.to(btn, { x: x * 0.24, y: y * 0.3, duration: 0.35, ease: 'power3.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

/* ============ BlurText Typography ============ */
function initBlurTypography() {
  if (typeof initBlurText !== 'function' || reduceMotion) return;
  const closingLine = document.querySelector('.closing-line');
  if (closingLine) {
    initBlurText(closingLine, {
      effect: 'blur',
      animateBy: 'words',
      direction: 'top',
      trigger: 'view',
      delay: 45,
      stepDuration: 0.35,
      blur: 8,
      distance: 20
    });
  }
}

/* ============ Modern Studio Giant Name Footer (Reflexlabs & ReactBits Aesthetics) ============ */
function initModernFooter() {
  const footer = document.querySelector('.site-footer');
  if (!footer) return;

  // 1. Live Coimbatore IST Clock (HH:MM:SS IST)
  const clockEl = document.getElementById('liveIstClock');
  if (clockEl) {
    const updateClock = () => {
      try {
        const istTime = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).format(new Date());
        clockEl.textContent = `${istTime} IST`;
      } catch (e) {
        const d = new Date();
        const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        const ist = new Date(utc + (3600000 * 5.5));
        const pad = (n) => String(n).padStart(2, '0');
        clockEl.textContent = `${pad(ist.getHours())}:${pad(ist.getMinutes())}:${pad(ist.getSeconds())} IST`;
      }
    };
    updateClock();
    setInterval(updateClock, 1000);
  }

  // 2. Interactive Action Pill / Back to Top
  const actionPill = document.getElementById('footerActionPill');
  if (actionPill) {
    actionPill.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToSection(0, 0);
    });
  }

  // 3. GSAP ScrollTrigger Entrance Animation for Giant Name
  const chars = footer.querySelectorAll('.giant-name .char');
  const giantTrack = document.getElementById('giantNameTrack') || document.getElementById('giantNameWrapper');

  if (chars.length && giantTrack) {
    if (!reduceMotion) {
      gsap.set(chars, {
        yPercent: 110,
        rotateX: 20,
        transformOrigin: '50% 100%',
        opacity: 0.1
      });

      ScrollTrigger.create({
        trigger: giantTrack,
        start: 'top 90%',
        once: true,
        onEnter: () => {
          gsap.to(chars, {
            yPercent: 0,
            rotateX: 0,
            opacity: 1,
            duration: 0.95,
            stagger: {
              each: 0.022,
              from: 'start'
            },
            ease: 'power4.out',
            onComplete: () => {
              gsap.set(chars, { clearProps: 'transform,opacity' });
            }
          });
        }
      });
    } else {
      gsap.set(chars, { opacity: 1, yPercent: 0 });
    }
  }
}

/* ============ Card Spotlight: Soft Red Radial Glow Following Pointer ============ */
function initCardSpotlight() {
  const cards = document.querySelectorAll('.project-card, .case, [data-spotlight]');
  if (!cards.length) return;

  cards.forEach(card => {
    let rafId = null;

    const onPointerMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
        card.style.setProperty('--spotlight-opacity', '1');
      });
    };

    const onPointerEnter = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
      card.style.setProperty('--spotlight-opacity', '1');
    };

    const onPointerLeave = () => {
      if (rafId) cancelAnimationFrame(rafId);
      card.style.setProperty('--spotlight-opacity', '0');
    };

    card.addEventListener('pointermove', onPointerMove, { passive: true });
    card.addEventListener('pointerenter', onPointerEnter, { passive: true });
    card.addEventListener('pointerleave', onPointerLeave, { passive: true });
  });
}

/* ============ Minimal Branded Intro Preloader ============ */
function initPreloader(onComplete) {
  const preloader = document.getElementById('preloader');
  if (!preloader) {
    if (onComplete) onComplete();
    return;
  }

  // If user prefers reduced motion, skip intro animation immediately
  if (reduceMotion) {
    preloader.style.display = 'none';
    if (onComplete) onComplete();
    return;
  }

  // Lock scrolling during preloader intro
  document.body.classList.add('loading-lock');
  if (lenis) lenis.stop();

  const fill = document.getElementById('preloaderFill');
  const pctEl = document.getElementById('preloaderPct');
  const statusEl = document.getElementById('preloaderStatusText');
  const content = preloader.querySelector('.preloader-content');
  const shield = preloader.querySelector('.preloader-shield');

  let isDismissed = false;
  const dismiss = () => {
    if (isDismissed) return;
    isDismissed = true;

    // Smooth curtain lift animation
    const exitTl = gsap.timeline({
      onComplete: () => {
        document.body.classList.remove('loading-lock');
        preloader.style.display = 'none';
        if (lenis) lenis.start();
        ScrollTrigger.refresh();
      }
    });

    exitTl
      .to(content, { opacity: 0, y: -16, duration: 0.25, ease: 'power2.in' })
      .to(preloader, { yPercent: -100, duration: 0.65, ease: 'power4.inOut' }, '-=0.05')
      .add(() => {
        if (onComplete) onComplete();
      }, '-=0.18');
  };

  // Skip instantly on click or keyboard press
  preloader.addEventListener('click', dismiss);
  const handleKeySkip = (e) => {
    if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
      window.removeEventListener('keydown', handleKeySkip);
      dismiss();
    }
  };
  window.addEventListener('keydown', handleKeySkip, { once: true });

  // Progress counter and draw-in animation
  const progressObj = { value: 0 };
  const introTl = gsap.timeline();

  if (shield) {
    introTl.fromTo(shield,
      { scale: 0.82, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.5)' }
    );
  }

  introTl.to(progressObj, {
    value: 100,
    duration: 1.05,
    ease: 'power2.inOut',
    onUpdate: () => {
      const val = Math.round(progressObj.value);
      if (fill) fill.style.width = val + '%';
      if (pctEl) pctEl.textContent = val + '%';
      if (statusEl) {
        if (val < 40) {
          statusEl.textContent = 'INITIALIZING ENCLAVE';
        } else if (val < 85) {
          statusEl.textContent = 'SECURING PERIMETER';
        } else {
          statusEl.textContent = 'SECURITY CLEARED';
        }
      }
    },
    onComplete: () => {
      setTimeout(dismiss, 140);
    }
  }, '-=0.15');

  // Failsafe auto-dismiss after 1.6s for headless AI crawlers, bots, or slow environments
  setTimeout(dismiss, 1600);
}

/* ============ Main Boot Sequence ============ */
function boot() {
  const main = document.querySelector('main');
  if (main) gsap.set(main, { opacity: 1 });

  initHeroGrainient();
  initNav();
  initScrollUI();
  initLinePath();
  initSectionPinning();
  initBlurTypography();
  initCustomCursor();
  initMagneticButtons();
  initCardSpotlight();
  initModal();
  initModernFooter();
  initPreloader(() => {
    pageIntro();
  });

  // Refresh ScrollTrigger once fonts load or layout stabilizes
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
    });
  } else {
    setTimeout(() => ScrollTrigger.refresh(), 300);
  }

  // Window resize handler: recalculate ScrollTrigger pinning
  window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
  });

  // Handle direct navigation with hash on initial load
  if (window.location.hash) {
    const hashTarget = document.querySelector(window.location.hash);
    if (hashTarget) {
      setTimeout(() => {
        scrollToSection(hashTarget, 0);
      }, 350);
    }
  }
}

boot();

/* Failsafe to guarantee visibility */
window.addEventListener('load', () => {
  setTimeout(() => {
    const main = document.querySelector('main');
    if (main && getComputedStyle(main).opacity === '0') gsap.set(main, { opacity: 1 });
    if (!hasPageIntroRun) {
      pageIntro();
    } else {
      gsap.to('.hero-name .word-mask span', { yPercent: 0, opacity: 1, rotateX: 0, duration: 0.4 });
    }
    ScrollTrigger.refresh();
  }, 2800);
});
