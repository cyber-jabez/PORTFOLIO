/**
 * theme.js — Robust Theme Switcher with Custom Circular Reveal Transition
 * Supports View Transitions API, CSS Ripple Fallback, LocalStorage persistence,
 * and system preference synchronization.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'portfolio-theme';
  const THEME_ATTR = 'data-theme';
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');

  /**
   * Get the initial theme: saved in localStorage, or system preference, fallback to dark
   */
  function getPreferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Default to dark for cybersecurity portfolio identity
    return 'dark';
  }

  /**
   * Update the DOM and notify listeners
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute(THEME_ATTR, theme);
    document.documentElement.style.colorScheme = theme;

    // Update all theme toggle buttons on the page
    document.querySelectorAll('.theme-toggle').forEach((btn) => {
      const isLight = theme === 'light';
      btn.setAttribute('aria-pressed', isLight ? 'true' : 'false');
      btn.setAttribute(
        'aria-label',
        isLight ? 'Switch to dark theme' : 'Switch to light theme'
      );
      btn.setAttribute(
        'title',
        isLight ? 'Switch to dark mode' : 'Switch to light mode'
      );
    });

    // Dispatch custom event for WebGL / Canvas / Grainient sync
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }

  /**
   * Perform circular wave ripple transition
   */
  function switchThemeWithAnimation(newTheme, clickX, clickY) {
    const isDark = newTheme === 'dark';
    const x = clickX ?? window.innerWidth / 2;
    const y = clickY ?? window.innerHeight / 2;

    // Calculate maximum radius to screen corners
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // If reduced motion is requested, switch immediately
    if (REDUCED_MOTION.matches) {
      applyTheme(newTheme);
      localStorage.setItem(STORAGE_KEY, newTheme);
      return;
    }

    // 1. Native View Transitions API (Modern Chromium, Safari 18+)
    if (document.startViewTransition && typeof document.startViewTransition === 'function') {
      const transition = document.startViewTransition(() => {
        applyTheme(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
      });

      transition.ready.then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`
        ];

        // Animate the new theme view expanding outwards from click point (symmetrical for dark and light)
        document.documentElement.animate(
          {
            clipPath: clipPath
          },
          {
            duration: 520,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-new(root)'
          }
        );
      }).catch(() => {
        // Fallback in case of unexpected transition error
        applyTheme(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
      });
      return;
    }

    // 2. High-performance Canvas/DOM Radial Ripple Fallback (Firefox, older browsers)
    const ripple = document.createElement('div');
    ripple.className = 'theme-transition-ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = `${endRadius * 2.2}px`;
    ripple.style.height = `${endRadius * 2.2}px`;
    ripple.style.marginLeft = `-${endRadius * 1.1}px`;
    ripple.style.marginTop = `-${endRadius * 1.1}px`;
    ripple.style.backgroundColor = isDark ? '#000000' : '#F4F4F6';

    document.body.appendChild(ripple);

    requestAnimationFrame(() => {
      ripple.classList.add('expanding');
      setTimeout(() => {
        applyTheme(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
        ripple.classList.add('fading');
        setTimeout(() => {
          if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
          }
        }, 400);
      }, 350);
    });
  }

  /**
   * Toggle between dark and light
   */
  function toggleTheme(event) {
    const current = document.documentElement.getAttribute(THEME_ATTR) || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';

    let x, y;
    if (event) {
      if (typeof event.clientX === 'number' && typeof event.clientY === 'number' && (event.clientX > 0 || event.clientY > 0)) {
        x = event.clientX;
        y = event.clientY;
      } else if (event.currentTarget && event.currentTarget.getBoundingClientRect) {
        const rect = event.currentTarget.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
    }

    switchThemeWithAnimation(next, x, y);
  }

  // Initialize theme as soon as DOM is ready
  function init() {
    const currentTheme = getPreferredTheme();
    applyTheme(currentTheme);

    // Bind all theme toggles
    document.querySelectorAll('.theme-toggle').forEach((btn) => {
      btn.addEventListener('click', toggleTheme);
    });

    // Also support keyboard shortcut: Alt + T
    window.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        toggleTheme();
      }
    });

    // Listen for OS system theme changes if user hasn't explicitly set preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export to window for programmatic control
  window.PortfolioTheme = {
    toggle: toggleTheme,
    set: (theme) => switchThemeWithAnimation(theme),
    get: () => document.documentElement.getAttribute(THEME_ATTR) || 'dark'
  };
})();
