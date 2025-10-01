// Admin Panel CRUD Operations for Events Management

const API_BASE = document.querySelector('meta[name="api-base"]')?.content || 'https://atlazmusicbe-backend-theta.vercel.app';

let currentEditId = null;

// DOM Elements
const form = document.getElementById('booking-form');
const submitBtn = document.getElementById('submit');
const cancelBtn = document.getElementById('cancel-edit');
const editIdField = document.getElementById('edit-id');
const alert = document.getElementById('admin-alert');
const bookingsList = document.getElementById('admin-bookings-list');
const emptyMsg = document.getElementById('admin-empty');

// Form fields
const fields = {
    date: document.getElementById('date'),
    start: document.getElementById('start'),
    end: document.getElementById('end'),
    name: document.getElementById('name'),
    venue: document.getElementById('venue'),
    link: document.getElementById('link')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadBookings();
    setupEventListeners();
});

function setupEventListeners() {
    form.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', cancelEdit);
}

// API Functions
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        showAlert(`Request failed: ${error.message}`, 'error');
        throw error;
    }
}

async function loadBookings() {
    try {
        const bookings = await apiRequest('/events/');
        renderBookings(bookings);
    } catch (error) {
        showAlert('Failed to load bookings', 'error');
    }
}

async function createBooking(bookingData) {
    return await apiRequest('/events/', {
        method: 'POST',
        body: JSON.stringify(bookingData)
    });
}

async function updateBooking(id, bookingData) {
    return await apiRequest(`/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(bookingData)
    });
}

async function deleteBooking(id) {
    return await apiRequest(`/events/${id}`, {
        method: 'DELETE'
    });
}

// Form Handling
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const bookingData = getFormData();
    if (!validateForm(bookingData)) return;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = currentEditId ? 'Updating...' : 'Adding...';

        if (currentEditId) {
            await updateBooking(currentEditId, bookingData);
            showAlert('Event updated successfully!', 'success');
        } else {
            await createBooking(bookingData);
            showAlert('Event added successfully!', 'success');
        }

        resetForm();
        loadBookings();
    } catch (error) {
        showAlert(currentEditId ? 'Failed to update event' : 'Failed to add event', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = currentEditId ? 'Update booking' : 'Add booking';
    }
}

function getFormData() {
    return {
        date: fields.date.value,
        start: fields.start.value || null,
        end: fields.end.value || null,
        name: fields.name.value.trim(),
        venue: fields.venue.value.trim(),
        link: fields.link.value.trim() || null
    };
}

function validateForm(data) {
    if (!data.name || !data.venue || !data.date) {
        showAlert('Please fill in all required fields (Name, Venue, Date)', 'error');
        return false;
    }
    return true;
}

function resetForm() {
    form.reset();
    currentEditId = null;
    editIdField.value = '';
    submitBtn.textContent = 'Add booking';
    cancelBtn.style.display = 'none';
}

function cancelEdit() {
    resetForm();
    showAlert('Edit cancelled', 'info');
}

// CRUD Operations UI
function startEdit(booking) {
    currentEditId = booking.id;
    editIdField.value = booking.id;
    
    // Populate form with booking data
    fields.date.value = booking.date || '';
    fields.start.value = booking.start || '';
    fields.end.value = booking.end || '';
    fields.name.value = booking.name || '';
    fields.venue.value = booking.venue || '';
    fields.link.value = booking.link || '';
    
    // Update UI for edit mode
    submitBtn.textContent = 'Update booking';
    cancelBtn.style.display = 'inline-block';
    
    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    showAlert(`Editing: ${booking.name}`, 'info');
}

async function confirmDelete(booking) {
    const confirmed = confirm(`Are you sure you want to delete "${booking.name}"?\n\nThis action cannot be undone.`);
    
    if (confirmed) {
        try {
            await deleteBooking(booking.id);
            showAlert('Event deleted successfully!', 'success');
            loadBookings();
        } catch (error) {
            showAlert('Failed to delete event', 'error');
        }
    }
}

// UI Rendering
function renderBookings(bookings = []) {
    if (!bookings || bookings.length === 0) {
        bookingsList.innerHTML = '';
        emptyMsg.style.display = 'block';
        return;
    }

    emptyMsg.style.display = 'none';
    
    // Sort by date ascending
    bookings.sort((a, b) => (a.date > b.date ? 1 : -1));

    bookingsList.innerHTML = bookings.map(booking => createBookingRow(booking)).join('');
}

function createBookingRow(booking) {
    const dateLbl = formatDateLabel(booking.date);
    const timeLbl = formatTimeLabel(booking.start, booking.end);
    const linkLbl = booking.link ? `<a href="${booking.link}" target="_blank" rel="noopener">🔗</a>` : '-';
    
    return `
        <div class="row">
            <div><strong>${escapeHtml(booking.name)}</strong></div>
            <div>${dateLbl}</div>
            <div class="hide-sm">${timeLbl}</div>
            <div>${escapeHtml(booking.venue)}</div>
            <div>${linkLbl}</div>
            <div class="actions-cell">
                <button class="btn-icon edit-btn" onclick="startEdit(${JSON.stringify(booking).replace(/"/g, '&quot;')})" title="Edit Event">
                    ✏️
                </button>
                <button class="btn-icon delete-btn" onclick="confirmDelete(${JSON.stringify(booking).replace(/"/g, '&quot;')})" title="Delete Event">
                    🗑️
                </button>
            </div>
        </div>
    `;
}
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

// Utility Functions
function formatDateLabel(iso) {
    if (!iso || iso === "00:00" || iso.length < 8) {
        return "Date TBD";
    }
    try {
        const d = new Date(iso + 'T00:00:00');
        if (isNaN(d.getTime())) {
            return "Date TBD";
        }
        return d.toLocaleDateString(undefined, { 
            weekday: 'short',
            month: 'short', 
            day: '2-digit',
            year: 'numeric'
        });
    } catch { 
        return "Date TBD"; 
    }
}

function formatTimeLabel(start, end) {
    if (!start && !end) {
        return 'TBD';
    } else if (start && end) {
        return `${start}–${end}`;
    } else if (start) {
        return start;
    } else {
        return end;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAlert(message, type = 'info') {
    alert.textContent = message;
    alert.className = `alert alert-${type}`;
    alert.style.display = 'block';
    
    // Auto-hide success and info messages
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            alert.style.display = 'none';
        }, 4000);
    }
}

// Make functions available globally for onclick handlers
window.startEdit = startEdit;
window.confirmDelete = confirmDelete;
