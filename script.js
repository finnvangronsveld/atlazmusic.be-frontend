/* ATLAZ site interactions */

const SELECTORS = {
  preloader: '#preloader',
  progressBar: '#progress-bar',
  progressText: '#progress-text',
  navbar: '#navbar',
  topLinks: '#top-links',
};

const el = (sel) => document.querySelector(sel);

function setYear() {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
}

function showNavbarOnScroll() {
  const nav = el(SELECTORS.navbar);
  const topl = el(SELECTORS.topLinks);
  if (!nav) return;

  // If IntersectionObserver is supported, show navbar only when top-links are fully out of view
  if ('IntersectionObserver' in window && topl) {
    const observer = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e.isIntersecting) {
          // top links visible -> hide navbar
          nav.classList.remove('visible');
          nav.setAttribute('aria-hidden', 'true');
          topl.classList.remove('hidden');
        } else {
          // top links gone -> show navbar
          nav.classList.add('visible');
          nav.setAttribute('aria-hidden', 'false');
          topl.classList.add('hidden');
        }
      },
      { root: null, threshold: 0 }
    );
    observer.observe(topl);
  } else {
    // Fallback to simple scroll position
    const onScroll = () => {
      const scrolled = window.scrollY || document.documentElement.scrollTop;
      if (scrolled > 40) {
        nav.classList.add('visible');
        nav.setAttribute('aria-hidden', 'false');
        if (topl) topl.classList.add('hidden');
      } else {
        nav.classList.remove('visible');
        nav.setAttribute('aria-hidden', 'true');
        if (topl) topl.classList.remove('hidden');
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
}

function preloaderFirstVisit() {
  const pre = el(SELECTORS.preloader);
  if (!pre) return Promise.resolve();

  const seen = sessionStorage.getItem('atlaz_seen');
  if (seen === '1') {
    // Skip animation on subsequent visits
    pre.style.display = 'none';
    document.body.classList.remove('no-scroll');
    return Promise.resolve();
  }

  document.body.classList.add('no-scroll');
  return new Promise((resolve) => {
    const bar = el(SELECTORS.progressBar);
    const text = el(SELECTORS.progressText);
    let p = 0;

    const tick = () => {
      // Ease the progress to mimic loading
      const increment = Math.max(1, Math.round((100 - p) * 0.08));
      p = Math.min(100, p + increment);
      if (bar) bar.style.width = p + '%';
      if (text) text.textContent = p + '%';

      if (p < 100) {
        setTimeout(tick, 80);
      } else {
        setTimeout(() => {
          pre.style.opacity = '0';
          pre.setAttribute('aria-hidden', 'true');
          document.body.classList.remove('no-scroll');
          setTimeout(() => {
            pre.style.display = 'none';
            sessionStorage.setItem('atlaz_seen', '1');
            resolve();
          }, 320);
        }, 180);
      }
    };

    // Ensure images are at least requested while we animate
    const heroLogo = document.querySelector('.hero-logo');
    if (heroLogo && heroLogo.complete) {
      // Already cached, just run ticker
      tick();
    } else {
      // Start animation immediately; image will load in the background
      tick();
    }
  });
}

function enableSmoothAnchors() {
  const ease = (t) => {
    // cubic-bezier(0.2, 0.8, 0.2, 1)
    const cX = (p1x, p2x, t) => 3*p1x*(1-t)*(1-t)*t + 3*p2x*(1-t)*t*t + t*t*t;
    const cY = (p1y, p2y, t) => 3*p1y*(1-t)*(1-t)*t + 3*p2y*(1-t)*t*t + t*t*t;
    // invert x to get param for y — Newton's method
    const p1x=0.2, p1y=0.8, p2x=0.2, p2y=1.0;
    let u = t;
    for (let i=0;i<5;i++) {
      const x = cX(p1x, p2x, u) - t;
      const dx = 3*(1-u)*(1-u)*p1x + 6*(1-u)*u*(p2x - p1x) + 3*u*u*(1 - p2x);
      if (Math.abs(dx) < 1e-6) break;
      u -= x / dx;
      u = Math.min(1, Math.max(0, u));
    }
    return cY(p1y, p2y, u);
  };

  const animateScroll = (toY, duration = 600) => {
    const startY = window.scrollY || document.documentElement.scrollTop;
    const delta = toY - startY;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const e = ease(t);
      window.scrollTo(0, startY + delta * e);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const rect = target.getBoundingClientRect();
      const toY = (window.scrollY || document.documentElement.scrollTop) + rect.top;
      animateScroll(toY, 700);
    });
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  setYear();
  showNavbarOnScroll();
  enableSmoothAnchors();
  await preloaderFirstVisit();
  setupMobileMenu();
});

function setupMobileMenu() {
  const btn = document.getElementById('hamburger');
  const panel = document.getElementById('mobile-menu');
  const nav = el(SELECTORS.navbar);
  if (!btn || !panel || !nav) return;

  const close = () => {
    btn.setAttribute('aria-expanded', 'false');
    panel.classList.remove('open');
    panel.setAttribute('hidden', '');
  };

  const open = () => {
    btn.setAttribute('aria-expanded', 'true');
    panel.removeAttribute('hidden');
    // trigger transition: force reflow then add class
    // eslint-disable-next-line no-unused-expressions
    void panel.offsetHeight;
    requestAnimationFrame(() => panel.classList.add('open'));
  };

  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    if (expanded) close(); else open();
  });

  // Close when clicking a link
  panel.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => close());
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  // Ensure scroll show/hide navbar does not conflict: if navbar hides due to returning to top, also close menu
  const topl = el(SELECTORS.topLinks);
  if ('IntersectionObserver' in window && topl) {
    const obs = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e.isIntersecting) {
        // returning to top
        close();
      }
    }, { root: null, threshold: 0 });
    obs.observe(topl);
  }
}
