// Admin interactions for managing bookings

const $ = (s) => document.querySelector(s);
const apiBase = document.querySelector('meta[name="api-base"]')?.content?.trim().replace(/\/$/, '') || '';

function setAlert(kind, message) {
  const box = $('#admin-alert');
  if (!box) return;
  box.className = 'alert ' + (kind || '');
  box.textContent = message || '';
  box.style.display = message ? '' : 'none';
}

async function getBookings() {
  try {
    const res = await fetch(apiBase + '/api/bookings', { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    setAlert('error', 'Failed to load bookings. Is the backend running?');
    return [];
  }
}

function fmtDate(iso) {
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  } catch { return iso; }
}

function renderList(items = []) {
  const list = $('#admin-bookings-list');
  const empty = $('#admin-empty');
  if (!list) return;
  list.innerHTML = '';
  if (!items.length) {
    if (empty) empty.style.display = '';
    return;
  }
  if (empty) empty.style.display = 'none';

  // sort ascending like frontend
  items.sort((a, b) => (a.date > b.date ? 1 : -1));

  for (const b of items) {
    const row = document.createElement('div');
    row.className = 'row';
    const name = document.createElement('div');
    name.textContent = b.name || 'Event';
    const date = document.createElement('div');
    date.textContent = fmtDate(b.date);
    const time = document.createElement('div');
    time.className = 'hide-sm';
    time.textContent = [b.start, b.end].filter(Boolean).join(' – ');
    const venue = document.createElement('div');
    venue.textContent = b.venue || '';
    const link = document.createElement('div');
    if (b.link) {
      const a = document.createElement('a');
      a.href = b.link; a.target = '_blank'; a.rel = 'noopener';
      a.className = 'link'; a.textContent = 'Open';
      link.appendChild(a);
    } else {
      link.textContent = '-';
    }
    row.append(name, date, time, venue, link);
    list.appendChild(row);
  }
}

function validate(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const errors = [];
  if (!data.date) errors.push('Date is required.');
  if (!data.name) errors.push('Name is required.');
  if (!data.venue) errors.push('Venue is required.');
  if (data.start && !/^\d{2}:\d{2}$/.test(data.start)) errors.push('Start must be HH:mm.');
  if (data.end && !/^\d{2}:\d{2}$/.test(data.end)) errors.push('End must be HH:mm.');
  if (data.link && !/^https?:\/\//i.test(data.link)) errors.push('Link must start with http:// or https://');
  return { data, errors };
}

async function submitBooking(payload) {
  const res = await fetch(apiBase + '/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

async function refresh() {
  const items = await getBookings();
  renderList(items);
}

window.addEventListener('DOMContentLoaded', async () => {
  await refresh();
  const form = document.getElementById('booking-form');
  const btn = document.getElementById('submit');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    setAlert('', '');
    const { data, errors } = validate(form);
    if (errors.length) {
      setAlert('error', errors.join(' '));
      return;
    }
    try {
      btn.disabled = true; btn.textContent = 'Saving…';
      await submitBooking(data);
      setAlert('success', 'Booking added.');
      form.reset();
      await refresh();
    } catch (err) {
      setAlert('error', 'Failed to add booking. Is the backend running?');
    } finally {
      btn.disabled = false; btn.textContent = 'Add booking';
    }
  });
});
