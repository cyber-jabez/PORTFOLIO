/**
 * BlurText — Animated blur text typography
 * Vanilla JS implementation matching React Bits <BlurText />
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.initBlurText = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const AXES = {
    top: ['y', -1],
    bottom: ['y', 1],
    left: ['x', -1],
    right: ['x', 1]
  };

  const CSS_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

  function buildRanks(count, staggerFrom, seedText) {
    const ranks = Array.from({ length: count }, (_, i) => i);
    if (staggerFrom === 'end') return ranks.map(i => count - 1 - i);
    if (staggerFrom === 'center') {
      const mid = (count - 1) / 2;
      const offset = count % 2 === 0 ? 0.5 : 0;
      return ranks.map(i => Math.abs(i - mid) - offset);
    }
    if (staggerFrom === 'random') {
      let seed = 2166136261;
      for (let i = 0; i < seedText.length; i++) seed = Math.imul(seed ^ seedText.charCodeAt(i), 16777619) >>> 0;
      const next = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      const order = ranks.slice();
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      order.forEach((piece, rank) => {
        ranks[piece] = rank;
      });
    }
    return ranks;
  }

  function initBlurText(target, options = {}) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return null;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    // Read options with data attributes fallback
    const text = options.text ?? element.getAttribute('data-text') ?? element.textContent.trim();
    const effect = options.effect ?? element.getAttribute('data-effect') ?? 'blur';
    const animateBy = options.animateBy ?? element.getAttribute('data-animate-by') ?? 'words';
    const direction = options.direction ?? element.getAttribute('data-direction') ?? 'top';
    const staggerFrom = options.staggerFrom ?? element.getAttribute('data-stagger-from') ?? 'start';
    const trigger = options.trigger ?? element.getAttribute('data-trigger') ?? 'view';
    const delay = typeof options.delay === 'number' ? options.delay : parseInt(element.getAttribute('data-delay') || '150', 10);
    const stepDuration = typeof options.stepDuration === 'number' ? options.stepDuration : parseFloat(element.getAttribute('data-step-duration') || '0.35');
    const blur = typeof options.blur === 'number' ? options.blur : parseInt(element.getAttribute('data-blur') || '10', 10);
    const distance = typeof options.distance === 'number' ? options.distance : parseInt(element.getAttribute('data-distance') || '40', 10);
    const focusOnHover = options.focusOnHover ?? (element.getAttribute('data-focus-on-hover') === 'true');
    const loop = options.loop ?? (element.getAttribute('data-loop') === 'true');
    const loopDelay = options.loopDelay ?? 2;
    const threshold = options.threshold ?? 0.1;
    const onAnimationComplete = options.onAnimationComplete;

    if (reduceMotion) {
      // Respect accessibility preferences
      element.textContent = text;
      if (typeof onAnimationComplete === 'function') onAnimationComplete();
      return { replay: () => {}, destroy: () => {} };
    }

    const [axis, sign] = AXES[direction] || AXES.top;
    const words = text.split(/\s+/).filter(Boolean);
    const emWords = Array.from(element.querySelectorAll('em')).map(em => em.textContent.trim().toLowerCase());

    // Build DOM pieces
    element.innerHTML = '';
    element.classList.add('blur-text-root');
    element.style.display = 'flex';
    element.style.flexWrap = 'wrap';

    // Accessible hidden text for screen readers
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
    sr.textContent = text;
    element.appendChild(sr);

    const pieces = [];
    const wordElements = [];

    words.forEach((word, w) => {
      const isLast = w === words.length - 1;
      const isEm = emWords.some(ew => ew.includes(word.toLowerCase()) || word.toLowerCase().includes(ew));
      const wordSpan = document.createElement('span');
      wordSpan.className = 'blur-text-word' + (isEm ? ' accent-em' : '');
      wordSpan.style.display = 'inline-flex';
      wordSpan.style.transition = `filter 0.45s ${CSS_EASE}, opacity 0.45s ${CSS_EASE}`;

      if (animateBy === 'words') {
        const pieceSpan = document.createElement('span');
        pieceSpan.className = 'blur-text-piece';
        pieceSpan.setAttribute('aria-hidden', 'true');
        pieceSpan.style.display = 'inline-block';
        pieceSpan.style.willChange = 'transform, filter, opacity';
        pieceSpan.textContent = isLast ? word : `${word}\u00A0`;
        wordSpan.appendChild(pieceSpan);
        pieces.push({ el: pieceSpan, wordIndex: w });
      } else {
        Array.from(word).forEach(char => {
          const pieceSpan = document.createElement('span');
          pieceSpan.className = 'blur-text-piece';
          pieceSpan.setAttribute('aria-hidden', 'true');
          pieceSpan.style.display = 'inline-block';
          pieceSpan.style.willChange = 'transform, filter, opacity';
          pieceSpan.textContent = char;
          wordSpan.appendChild(pieceSpan);
          pieces.push({ el: pieceSpan, wordIndex: w });
        });
        if (!isLast) {
          const spaceSpan = document.createElement('span');
          spaceSpan.className = 'blur-text-piece';
          spaceSpan.setAttribute('aria-hidden', 'true');
          spaceSpan.style.display = 'inline-block';
          spaceSpan.textContent = '\u00A0';
          wordSpan.appendChild(spaceSpan);
          pieces.push({ el: spaceSpan, wordIndex: w });
        }
      }

      element.appendChild(wordSpan);
      wordElements.push(wordSpan);
    });

    // Focus on hover
    if (focusOnHover) {
      wordElements.forEach((wEl, idx) => {
        wEl.addEventListener('mouseenter', () => {
          wordElements.forEach((other, oIdx) => {
            if (oIdx !== idx) {
              other.style.filter = `blur(${Math.min(6, Math.max(2, blur * 0.3))}px)`;
              other.style.opacity = '0.35';
            } else {
              other.style.filter = 'blur(0px)';
              other.style.opacity = '1';
            }
          });
        });
        wEl.addEventListener('mouseleave', () => {
          wordElements.forEach(other => {
            other.style.filter = 'blur(0px)';
            other.style.opacity = '1';
          });
        });
      });
    }

    const ranks = buildRanks(pieces.length, staggerFrom, text);
    const maxRank = ranks.reduce((max, r) => Math.max(max, r), 0);
    const staggerSec = Math.max(0, delay) / 1000;

    // Initial state: hidden & blurred
    function applyFromState(piece) {
      const el = piece.el;
      el.style.opacity = '0';
      el.style.filter = `blur(${Math.max(0, blur)}px)`;
      el.style.transition = 'none';

      if (effect === 'zoom') {
        const trans = axis === 'y' ? `translate3d(0, ${sign * distance * 0.35}px, 0)` : `translate3d(${sign * distance * 0.35}px, 0, 0)`;
        el.style.transform = `${trans} scale(1.4)`;
      } else if (effect === 'tilt') {
        const rotate = axis === 'y' ? `rotateX(${-sign * 50}deg)` : `rotateY(${sign * 50}deg)`;
        const trans = axis === 'y' ? `translate3d(0, ${sign * distance * 0.5}px, 0)` : `translate3d(${sign * distance * 0.5}px, 0, 0)`;
        el.style.transform = `perspective(600px) ${rotate} ${trans}`;
      } else if (effect === 'focus') {
        el.style.opacity = '0.2';
        el.style.transform = 'scale(1.12)';
      } else if (effect === 'drift') {
        const h = direction === 'right' ? 1 : -1;
        const v = axis === 'y' ? sign : 0;
        el.style.transform = `translate3d(${h * distance * 1.5}px, ${v * distance * 0.3}px, 0) skewX(${h * 26}deg)`;
      } else {
        // default blur
        const trans = axis === 'y' ? `translate3d(0, ${sign * distance}px, 0)` : `translate3d(${sign * distance}px, 0, 0)`;
        el.style.transform = trans;
      }
    }

    function animateIn() {
      pieces.forEach((piece, index) => {
        const el = piece.el;
        const rank = ranks[index];
        const delaySec = rank * staggerSec;

        // Force reflow
        void el.offsetWidth;

        el.style.transition = `transform ${stepDuration * 1.8}s ${CSS_EASE} ${delaySec}s, opacity ${stepDuration * 1.4}s ease-out ${delaySec}s, filter ${stepDuration * 1.6}s ${CSS_EASE} ${delaySec}s`;
        el.style.opacity = '1';
        el.style.filter = 'blur(0px)';
        el.style.transform = 'translate3d(0, 0, 0) scale(1) rotate(0deg) skew(0deg)';
      });

      const totalTimeMs = (stepDuration * 1.8 + maxRank * staggerSec) * 1000;
      setTimeout(() => {
        if (typeof onAnimationComplete === 'function') onAnimationComplete();
        if (loop) {
          setTimeout(animateOut, Math.max(0, loopDelay) * 1000);
        }
      }, totalTimeMs);
    }

    function animateOut() {
      pieces.forEach((piece, index) => {
        const el = piece.el;
        const rank = ranks[index];
        const delaySec = rank * (staggerSec * 0.4);

        el.style.transition = `transform ${stepDuration * 1.2}s ease-in ${delaySec}s, opacity ${stepDuration * 1.0}s ease-in ${delaySec}s, filter ${stepDuration * 1.2}s ease-in ${delaySec}s`;
        applyFromState(piece);
      });

      const outTimeMs = (stepDuration * 1.2 + maxRank * (staggerSec * 0.4)) * 1000;
      setTimeout(animateIn, outTimeMs);
    }

    function replay() {
      pieces.forEach(applyFromState);
      setTimeout(animateIn, 50);
    }

    // Prepare from-state initially
    pieces.forEach(applyFromState);

    // Trigger modes
    let observer = null;
    if (trigger === 'load') {
      setTimeout(animateIn, 60);
    } else if (trigger === 'hover') {
      element.style.cursor = 'pointer';
      element.addEventListener('mouseenter', replay);
      replay();
    } else if (trigger === 'click') {
      element.style.cursor = 'pointer';
      element.addEventListener('click', replay);
      replay();
    } else {
      // 'view' (default)
      observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          animateIn();
          observer.disconnect();
          observer = null;
        }
      }, { threshold });
      observer.observe(element);
    }

    return {
      replay,
      destroy() {
        if (observer) observer.disconnect();
        element.textContent = text;
      }
    };
  }

  // Auto-init elements with [data-blur-text]
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('[data-blur-text]').forEach(el => initBlurText(el));
    });
  }

  return initBlurText;
});

