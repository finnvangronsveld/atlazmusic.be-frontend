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
  await loadAndRenderBookings();
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

// --- Bookings rendering ---
/**
 * Contract:
 * - Input: array of bookings [{ date: 'YYYY-MM-DD', start: 'HH:mm', end: 'HH:mm', name: string, venue: string }]
 * - Output: Renders cards into #bookings-cards, or an empty message if none
 */
function getSampleBookings() {
  // Placeholder data; replace with backend fetch later
  return [
    { date: '2025-09-20', start: '22:00', end: '23:30', name: 'Books & Beats', venue: 'Onkrooid, Arendonk', link: 'https://example.com/books-and-beats' },
    { date: '2025-10-02', start: '23:00', end: '03:00', name: 'Girls Like DJs', venue: 'Kokorico, Lievegem', link: 'https://example.com/girls-like-djs' },
  ];
}

async function fetchBookings() {
  try {
    const apiBase = document.querySelector('meta[name="api-base"]')?.content?.trim() || '';
    const url = (apiBase ? apiBase.replace(/\/$/, '') : '') + '/api/bookings';
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    // Normalize to expected shape and coerce types
    return (Array.isArray(data) ? data : []).map((b) => ({
      date: b.date,           // 'YYYY-MM-DD'
      start: b.start,         // 'HH:mm'
      end: b.end,             // 'HH:mm'
      name: b.name,           // string
      venue: b.venue,         // string
      link: b.link || b.url || b.detailsUrl || '', // support common field names
    })).filter(b => b && b.date && b.name);
  } catch (e) {
    // Fallback to samples on any error
    return getSampleBookings();
  }
}

async function loadAndRenderBookings() {
  const bookings = await fetchBookings();
  renderBookings(bookings);
}

function formatDateLabel(iso) {
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
  } catch { return iso; }
}

function renderBookings(bookings = getSampleBookings()) {
  const wrap = document.getElementById('bookings-cards');
  const empty = document.getElementById('bookings-empty');
  if (!wrap) return;
  wrap.innerHTML = '';
  
  // Filter out past bookings - only show upcoming events
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day for comparison
  
  const upcomingBookings = (bookings || []).filter(b => {
    try {
      const eventDate = new Date(b.date + 'T00:00:00');
      return eventDate >= today;
    } catch {
      return false; // Invalid date format, exclude
    }
  });
  
  if (!upcomingBookings || upcomingBookings.length === 0) {
    if (empty) empty.style.display = '';
    return;
  }
  if (empty) empty.style.display = 'none';

  // Sort by date ascending
  upcomingBookings.sort((a, b) => (a.date > b.date ? 1 : -1));

  for (const b of upcomingBookings) {
    const card = document.createElement('article');
    card.className = 'card';

    const h3 = document.createElement('h3');
    h3.textContent = b.name || 'Event';

    const p = document.createElement('p');
    const dateLbl = formatDateLabel(b.date);
    const timeLbl = b.start && b.end ? `${b.start}–${b.end}` : b.start || '';
    p.textContent = `${dateLbl}${timeLbl ? ' • ' + timeLbl : ''} — ${b.venue || ''}`;

    // CTAs
    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '10px';

  const detailsBtn = document.createElement('a');
  detailsBtn.className = 'btn';
  detailsBtn.href = b.link || '#';
  if (b.link) { detailsBtn.target = '_blank'; detailsBtn.rel = 'noopener'; }
  detailsBtn.setAttribute('aria-label', `More info for ${b.name || 'event'}`);
  detailsBtn.textContent = 'Details';

    const gcalBtn = document.createElement('a');
    gcalBtn.className = 'btn';
    gcalBtn.target = '_blank';
    gcalBtn.rel = 'noopener';
    gcalBtn.href = buildGoogleCalendarUrl({
      name: b.name,
      date: b.date,
      start: b.start,
      end: b.end,
      venue: b.venue,
    });
  gcalBtn.setAttribute('aria-label', `Add ${b.name || 'event'} To Calender`);
  gcalBtn.textContent = 'Add To Calender';

    btnRow.append(detailsBtn, gcalBtn);
    card.append(h3, p, btnRow);
    wrap.appendChild(card);
  }
}

// --- Google Calendar URL helper ---
function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function toGCalDateTime(dateStr, timeStr) {
  // Build local Date, then format as UTC YYYYMMDDTHHMMSSZ
  const [y, m, d] = dateStr.split('-').map(Number);
  let hh = 0, mm = 0;
  if (timeStr) {
    const parts = timeStr.split(':');
    hh = Number(parts[0] || 0);
    mm = Number(parts[1] || 0);
  }
  const dt = new Date(y, (m - 1), d, hh, mm, 0);
  return (
    dt.getUTCFullYear() +
    pad2(dt.getUTCMonth() + 1) +
    pad2(dt.getUTCDate()) + 'T' +
    pad2(dt.getUTCHours()) +
    pad2(dt.getUTCMinutes()) +
    pad2(dt.getUTCSeconds()) + 'Z'
  );
}

function buildGoogleCalendarUrl({ name = 'Event', date, start, end, venue = '' }) {
  // If end is before/equal start, assume it ends the next day or add 2h default
  const startLocal = new Date(date + 'T' + (start || '20:00') + ':00');
  let endLocal;
  if (end) {
    endLocal = new Date(date + 'T' + end + ':00');
    if (endLocal <= startLocal) {
      // add 1 day if crosses midnight
      endLocal.setDate(endLocal.getDate() + 1);
    }
  } else {
    endLocal = new Date(startLocal.getTime() + 2 * 60 * 60 * 1000);
  }

  const startStr = (
    startLocal.getUTCFullYear() +
    pad2(startLocal.getUTCMonth() + 1) +
    pad2(startLocal.getUTCDate()) + 'T' +
    pad2(startLocal.getUTCHours()) +
    pad2(startLocal.getUTCMinutes()) +
    pad2(startLocal.getUTCSeconds()) + 'Z'
  );
  const endStr = (
    endLocal.getUTCFullYear() +
    pad2(endLocal.getUTCMonth() + 1) +
    pad2(endLocal.getUTCDate()) + 'T' +
    pad2(endLocal.getUTCHours()) +
    pad2(endLocal.getUTCMinutes()) +
    pad2(endLocal.getUTCSeconds()) + 'Z'
  );

  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const params = new URLSearchParams({
    text: name,
    dates: `${startStr}/${endStr}`,
    details: 'ATLAZ booking',
    location: venue,
  });
  return `${base}&${params.toString()}`;
}
