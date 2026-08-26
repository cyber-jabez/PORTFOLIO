gsap.registerPlugin(ScrollTrigger);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============ Wrap text for line/word reveals ============ */
function wrapLines(el){
  const html = el.innerHTML;
  const parts = html.split(/<br\s*\/?>/i);
  el.innerHTML = parts.map(p => `<span class="line"><span>${p.trim()}</span></span>`).join('');
}

function wrapWords(el){
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map(w => `<span class="word-mask"><span>${w}</span></span>`).join(' ');
}

function initTextSplit(){
  document.querySelectorAll('[data-split-lines]').forEach(wrapLines);
  document.querySelectorAll('[data-split-words]').forEach(wrapWords);
  
  // Set initial hidden transform using GSAP set so transforms don't conflict
  gsap.set('.page-hero h1 .line span, #hero .hero-name .line span, .hero-name .word-mask span', {
    yPercent: 110
  });
}
initTextSplit();

/* ============ Page load intro (per-page hero) ============ */
function pageIntro(){
  const tl = gsap.timeline({ delay: reduceMotion ? 0 : 0.1 });
  tl.from('header', { y:-30, opacity:0, duration:0.6, ease:'power3.out' }, 0);

  document.querySelectorAll('.page-hero .kicker, #hero .eyebrow').forEach(el=>{
    tl.from(el, { y:20, opacity:0, duration:0.5, ease:'power3.out' }, 0.15);
  });

  tl.to('.page-hero h1 .line span, #hero .hero-name .line span, .hero-name .word-mask span', {
    yPercent:0, opacity: 1, duration:0.85, ease:'power4.out', stagger:0.045
  }, 0.22);

  tl.from('.page-hero p, #hero .hero-role', { y:16, opacity:0, duration:0.6, ease:'power3.out' }, 0.55)
    .from('.hero-actions .btn, .page-hero .btn', { y:16, opacity:0, duration:0.5, stagger:0.08, ease:'power3.out' }, 0.65)
    .from('.scroll-cue', { opacity:0, duration:0.6 }, 0.8);
}

/* ============ Scroll-triggered reveals (GSAP ScrollTrigger) ============ */
function initScrollReveals(){
  gsap.utils.toArray('.chapter').forEach(ch=>{
    const num = ch.querySelector('.chapter-num');
    const lines = ch.querySelectorAll('.chapter-title .line span');
    const rule = ch.querySelector('.chapter-rule');
    const tl = gsap.timeline({ scrollTrigger:{ trigger:ch, start:'top 82%' } });
    if(num) tl.from(num, { y:16, opacity:0, duration:0.5, ease:'power3.out' });
    if(lines.length) tl.from(lines, { yPercent:110, duration:0.7, ease:'power4.out', stagger:0.06 }, '-=0.25');
    if(rule) tl.to(rule, { scaleX:1, duration:0.7, ease:'power3.out' }, '-=0.3');
  });

  // Target standard reveal elements (including log-entry and case cards once)
  gsap.utils.toArray('.reveal').forEach(el=>{
    gsap.from(el, {
      y:24, opacity:0, duration:0.7, ease:'power3.out',
      scrollTrigger:{ trigger:el, start:'top 88%', once: true }
    });
  });

  gsap.utils.toArray('.reveal-stagger').forEach(group=>{
    gsap.from(group.children, {
      y:20, opacity:0, duration:0.6, ease:'power3.out', stagger:0.08,
      scrollTrigger:{ trigger:group, start:'top 88%', once: true }
    });
  });

  // Hero parallax layers
  const stripes = document.getElementById('heroStripes');
  const glow = document.getElementById('heroGlow');
  if(stripes && !reduceMotion){
    gsap.to(stripes, { y:120, x:60, ease:'none', scrollTrigger:{ trigger:'#hero', start:'top top', end:'bottom top', scrub:0.6 } });
  }
  if(glow && !reduceMotion){
    gsap.to(glow, { y:180, ease:'none', scrollTrigger:{ trigger:'#hero', start:'top top', end:'bottom top', scrub:0.6 } });
  }

  // Next-link teaser
  gsap.utils.toArray('.next-link').forEach(el=>{
    gsap.from(el, { opacity:0, y:20, duration:0.7, ease:'power3.out', scrollTrigger:{ trigger:el, start:'top 92%', once: true } });
  });
}

/* ============ Follow-scroll SVG line (draws in as you scroll the whole page) ============ */
function initLinePath(){
  if(window.innerWidth <= 1000) return; // hidden on mobile
  const path = document.getElementById('scrollLinePath');
  if(!path) return;
  const len = path.getTotalLength();
  path.style.strokeDasharray = len;
  path.style.strokeDashoffset = len;
  gsap.to(path, {
    strokeDashoffset: 0,
    ease:'none',
    scrollTrigger:{ trigger: document.body, start:'top top', end:'bottom bottom', scrub:0.4 }
  });
}

/* ============ Scroll progress bar + back-to-top ============ */
function initScrollUI(){
  const fill = document.getElementById('scanFill');
  const backTop = document.getElementById('backTop');
  gsap.to(fill, {
    scaleX:1, ease:'none',
    scrollTrigger:{ trigger:document.body, start:'top top', end:'bottom bottom', scrub:0.2 }
  });
  gsap.set(fill, { scaleX:0, transformOrigin:'left' });
  ScrollTrigger.create({
    start: 500, onUpdate: self => {
      const y = window.scrollY;
      backTop.classList.toggle('show', y > 500);
    }
  });
  backTop.addEventListener('click', ()=> window.scrollTo({ top:0, behavior: reduceMotion?'auto':'smooth' }));
}

/* ============ Nav: Fullscreen Menu + active link ============ */
function initNav(){
  const menuBtn = document.getElementById('menuBtn');
  const mobileNav = document.getElementById('mobileNav');
  if(menuBtn && mobileNav){
    let open = false;
    const links = mobileNav.querySelectorAll('a');
    const eyebrow = mobileNav.querySelector('.nav-eyebrow');
    
    gsap.set(links, { opacity:0, y:35 });
    if(eyebrow) gsap.set(eyebrow, { opacity:0, y:15 });

    function toggleMenu(state){
      open = (typeof state === 'boolean') ? state : !open;
      menuBtn.setAttribute('aria-expanded', open);
      
      if(open){
        mobileNav.classList.add('open');
        document.body.style.overflow = 'hidden';
        
        // Morph hamburger to X
        menuBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
        
        const tl = gsap.timeline();
        tl.to(mobileNav, { yPercent:100, duration:0.55, ease:'power4.inOut' });
        if(eyebrow) tl.to(eyebrow, { opacity:1, y:0, duration:0.4, ease:'power3.out' }, '-=0.25');
        tl.to(links, { opacity:1, y:0, duration:0.5, stagger:0.06, ease:'power3.out' }, '-=0.2');
      } else {
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
        
        // Morph back to 3-bar hamburger
        menuBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`;
        
        gsap.to(mobileNav, { yPercent:0, duration:0.45, ease:'power4.inOut' });
        gsap.set(links, { opacity:0, y:35 });
        if(eyebrow) gsap.set(eyebrow, { opacity:0, y:15 });
      }
    }

    menuBtn.addEventListener('click', ()=>toggleMenu());

    links.forEach(a=>{
      a.addEventListener('click', ()=>{
        toggleMenu(false);
      });
    });

    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape' && open){
        toggleMenu(false);
      }
    });
  }

  // Mark active tab based on current page file
  let current = location.pathname.split('/').pop() || 'index.html';
  if(current === '' || current === '/') current = 'index.html';
  document.querySelectorAll('#mobileNav a').forEach(a=>{
    const href = a.getAttribute('href');
    if(href === current) a.classList.add('active');
  });
}

/* ============ Magnetic buttons ============ */
function initMagneticButtons(){
  if(reduceMotion) return;
  document.querySelectorAll('.btn, .case-arrow, .next-link .arrow, #backTop').forEach(btn=>{
    btn.addEventListener('mousemove', e=>{
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width/2;
      const y = e.clientY - r.top - r.height/2;
      gsap.to(btn, { x:x*0.28, y:y*0.35, duration:0.4, ease:'power3.out' });
    });
    btn.addEventListener('mouseleave', ()=>{
      gsap.to(btn, { x:0, y:0, duration:0.6, ease:'elastic.out(1,0.4)' });
    });
  });
}

/* ============ Page transitions (scarlet wipe between pages) ============ */
function initPageTransitions(){
  const wipe = document.getElementById('pageWipe');
  const label = document.getElementById('pageWipeLabel');
  if(!wipe) return;

  document.querySelectorAll('a[data-transition]').forEach(a=>{
    a.addEventListener('click', function(e){
      const href = this.getAttribute('href');
      if(!href || href.startsWith('#') || this.target === '_blank' || this.hasAttribute('download')) return;
      e.preventDefault();
      const dest = this.dataset.label || 'Loading';
      if(label) label.textContent = dest;
      sessionStorage.setItem('page_transitioning', 'true');
      wipe.classList.add('active');
      const tl = gsap.timeline({ onComplete: ()=>{ window.location.href = href; } });
      tl.set(wipe, { transform:'translateY(100%)' })
        .to(wipe, { transform:'translateY(0%)', duration: reduceMotion?0.01:0.55, ease:'power4.inOut' })
        .to(label, { opacity:1, duration:0.2 }, '-=0.15')
        .to({}, { duration: reduceMotion?0:0.25 });
    });
  });
}

/* ============ Modal (project detail) ============ */
function initModal(){
  const overlay = document.getElementById('modalOverlay');
  if(!overlay) return;
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const modalStack = document.getElementById('modalStack');
  const closeBtn = document.getElementById('modalClose');
  let lastFocused = null;

  function openModal(el){
    lastFocused = document.activeElement;
    modalTitle.textContent = el.dataset.title || '';
    modalBody.textContent = el.dataset.body || '';
    modalStack.innerHTML = (el.dataset.stack || '').split(',').filter(Boolean).map(s=>'<span class="stack-chip">'+s.trim()+'</span>').join('');
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    gsap.fromTo('#modalBox', { scale:0.94, y:20 }, { scale:1, y:0, duration:0.35, ease:'power3.out' });
    if(closeBtn) closeBtn.focus();
  }

  function closeModal(){
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if(lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  document.querySelectorAll('.case').forEach(c=>{
    c.addEventListener('click', ()=>openModal(c));
    c.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openModal(c); } });
  });

  if(closeBtn) closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e)=>{ if(e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && overlay.classList.contains('open')) closeModal(); });
}

/* ============ Boot sequence ============ */
function bootPageAnimations(){
  const main = document.querySelector('main');
  if(main) gsap.set(main, { opacity:1 });
  initNav();
  initScrollUI();
  initLinePath();
  initScrollReveals();
  initMagneticButtons();
  initPageTransitions();
  initModal();
  pageIntro();
  
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(()=>{ ScrollTrigger.refresh(); });
  } else {
    ScrollTrigger.refresh();
  }
}

bootPageAnimations();

/* Failsafe: if anything above throws or stalls, ensure the page and text are fully visible */
window.addEventListener('load', ()=>{
  setTimeout(()=>{
    const main = document.querySelector('main');
    if(main && getComputedStyle(main).opacity === '0') gsap.set(main, { opacity:1 });
    gsap.to('.page-hero h1 .line span, #hero .hero-name .line span, .hero-name .word-mask span', {
      yPercent: 0, duration: 0.4
    });
  }, 1500);
});

/* Entrance wipe-out on arrival */
function runArrivalWipe(){
  const wipe = document.getElementById('pageWipe');
  if(!wipe) return;

  const isTransitioning = sessionStorage.getItem('page_transitioning') === 'true';
  sessionStorage.removeItem('page_transitioning');

  if(isTransitioning){
    wipe.classList.add('active');
    gsap.set(wipe, { transform: 'translateY(0%)' });
    gsap.to(wipe, {
      transform: 'translateY(-100%)',
      duration: reduceMotion ? 0.01 : 0.6,
      ease: 'power4.inOut',
      delay: 0.05,
      onComplete: ()=>{
        wipe.classList.remove('active');
      }
    });
  } else {
    // Normal direct visit / reload: keep completely removed
    wipe.classList.remove('active');
  }
}

if(document.readyState === 'loading'){
  window.addEventListener('DOMContentLoaded', runArrivalWipe);
} else {
  runArrivalWipe();
}
