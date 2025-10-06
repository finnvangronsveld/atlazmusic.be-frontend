// Modern Admin Panel with Modal-based CRUD Operations

const API_BASE = 'https://atlazmusicbe-backend-theta.vercel.app';

let currentEditId = null;
let allBookings = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing admin panel');
    console.log('API_BASE:', API_BASE);
    
    loadBookings();
    setupEventListeners();
});

function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // Add Event Button
    const addEventBtn = document.getElementById('add-event-btn');
    if (addEventBtn) {
        addEventBtn.addEventListener('click', () => openModal('add'));
    }
    
    // Modal Close
    const modalClose = document.getElementById('modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    // Cancel Button
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    
    // Form Submit
    const form = document.getElementById('booking-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Modal backdrop click
    const modalBackdrop = document.querySelector('.modal-backdrop');
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeModal);
    }
}

async function loadBookings() {
    console.log('Loading bookings from API...');
    
    const eventCount = document.getElementById('event-count');
    const bookingsList = document.getElementById('admin-bookings-list');
    const emptyMsg = document.getElementById('admin-empty');
    
    try {
        if (eventCount) eventCount.textContent = 'Loading...';
        
        console.log('Fetching from:', API_BASE + '/events/');
        const response = await fetch(API_BASE + '/events/');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const bookings = await response.json();
        console.log('Received bookings:', bookings);
        
        allBookings = Array.isArray(bookings) ? bookings : [];
        renderBookings(allBookings);
        updateEventCount();
        
    } catch (error) {
        console.error('Error loading bookings:', error);
        if (eventCount) eventCount.textContent = 'Error';
        showAlert('Failed to load events: ' + error.message, 'error');
        renderBookings([]);
    }
}

function renderBookings(bookings = []) {
    console.log('Rendering bookings:', bookings.length, 'items');
    
    const bookingsList = document.getElementById('admin-bookings-list');
    const emptyMsg = document.getElementById('admin-empty');
    
    if (!bookingsList) {
        console.error('Bookings list element not found!');
        return;
    }
    
    if (!bookings || bookings.length === 0) {
        console.log('No bookings to display, showing empty state');
        bookingsList.innerHTML = '';
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }
    
    if (emptyMsg) emptyMsg.style.display = 'none';
    
    // Sort bookings by date
    bookings.sort((a, b) => {
        if (a.date && b.date) {
            return a.date.localeCompare(b.date);
        }
        return 0;
    });
    
    const html = bookings.map(booking => createEventItem(booking)).join('');
    bookingsList.innerHTML = html;
    console.log('Rendered HTML length:', html.length);
}

function createEventItem(booking) {
    const dateDisplay = formatDate(booking.date);
    const timeDisplay = formatTime(booking.start, booking.end);
    const linkDisplay = booking.link ? `<a href="${escapeHtml(booking.link)}" target="_blank" class="link">↗</a>` : '-';
    
    return `
        <div class="event-item">
            <div class="event-info">
                <div class="event-name">${escapeHtml(booking.name)}</div>
                <div class="event-date">${dateDisplay}</div>
                <div class="event-time">${timeDisplay}</div>
                <div class="event-venue">${escapeHtml(booking.venue)}</div>
                <div class="event-link">${linkDisplay}</div>
            </div>
            <div class="event-actions">
                <button class="btn-icon edit-btn" onclick="editEvent(${booking.id})" title="Edit Event">
                    Edit
                </button>
                <button class="btn-icon delete-btn" onclick="deleteEvent(${booking.id}, '${escapeHtml(booking.name)}')" title="Delete Event">
                    Delete
                </button>
            </div>
        </div>
    `;
}

function formatDate(dateStr) {
    if (!dateStr || dateStr === "00:00") {
        return "Date TBD";
    }
    
    try {
        const date = new Date(dateStr + 'T00:00:00');
        if (isNaN(date.getTime())) {
            return "Date TBD";
        }
        
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch (e) {
        console.warn('Date formatting error:', e);
        return "Date TBD";
    }
}

function formatTime(start, end) {
    if (!start && !end) {
        return 'Time TBD';
    }
    
    if (start && end) {
        return `${start} – ${end}`;
    } else if (start) {
        return start;
    } else {
        return end;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateEventCount() {
    const eventCount = document.getElementById('event-count');
    if (eventCount) {
        const count = allBookings.length;
        eventCount.textContent = `${count} event${count !== 1 ? 's' : ''}`;
    }
}

function openModal(mode, booking = null) {
    console.log('Opening modal:', mode, booking);
    
    const modal = document.getElementById('event-modal');
    const modalTitle = document.getElementById('modal-title');
    const submitBtn = document.getElementById('submit-btn');
    
    if (!modal) {
        console.error('Modal element not found!');
        return;
    }
    
    currentEditId = booking?.id || null;
    
    if (mode === 'add') {
        if (modalTitle) modalTitle.textContent = 'Add New Event';
        if (submitBtn) submitBtn.textContent = 'Add Event';
        resetForm();
    } else if (mode === 'edit' && booking) {
        if (modalTitle) modalTitle.textContent = 'Edit Event';
        if (submitBtn) submitBtn.textContent = 'Update Event';
        populateForm(booking);
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Focus first input
    setTimeout(() => {
        const firstInput = modal.querySelector('input[type="date"]');
        if (firstInput) firstInput.focus();
    }, 100);
}

function closeModal() {
    console.log('Closing modal');
    
    const modal = document.getElementById('event-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    resetForm();
    currentEditId = null;
}

function resetForm() {
    const form = document.getElementById('booking-form');
    if (form) {
        form.reset();
    }
    
    const editId = document.getElementById('edit-id');
    if (editId) {
        editId.value = '';
    }
}

function populateForm(booking) {
    console.log('Populating form with:', booking);
    
    const fields = {
        'edit-id': booking.id,
        'date': booking.date || '',
        'start': booking.start || '',
        'end': booking.end || '',
        'name': booking.name || '',
        'venue': booking.venue || '',
        'link': booking.link || ''
    };
    
    Object.entries(fields).forEach(([fieldId, value]) => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value;
        }
    });
}

async function handleFormSubmit(event) {
    event.preventDefault();
    console.log('Form submitted');
    
    const formData = {
        date: document.getElementById('date').value.trim(),
        start: document.getElementById('start').value.trim() || null,
        end: document.getElementById('end').value.trim() || null,
        name: document.getElementById('name').value.trim(),
        venue: document.getElementById('venue').value.trim(),
        link: document.getElementById('link').value.trim() || null
    };
    
    // Validation
    if (!formData.name || !formData.venue || !formData.date) {
        showAlert('Please fill in all required fields (Name, Venue, Date)', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('submit-btn');
    const originalText = submitBtn?.textContent;
    
    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = currentEditId ? 'Updating...' : 'Adding...';
        }
        
        let response;
        if (currentEditId) {
            // Update existing event
            response = await fetch(`${API_BASE}/events/${currentEditId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
        } else {
            // Create new event
            response = await fetch(`${API_BASE}/events/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Operation result:', result);
        
        showAlert(currentEditId ? 'Event updated successfully!' : 'Event added successfully!', 'success');
        closeModal();
        loadBookings(); // Reload the list
        
    } catch (error) {
        console.error('Form submission error:', error);
        showAlert('Failed to save event: ' + error.message, 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

function editEvent(id) {
    console.log('Edit event:', id);
    
    const booking = allBookings.find(b => b.id === id);
    if (booking) {
        openModal('edit', booking);
    } else {
        console.error('Booking not found for edit:', id);
        showAlert('Event not found', 'error');
    }
}

async function deleteEvent(id, name) {
    console.log('Delete event:', id, name);
    
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/events/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        showAlert('Event deleted successfully!', 'success');
        loadBookings(); // Reload the list
        
    } catch (error) {
        console.error('Delete error:', error);
        showAlert('Failed to delete event: ' + error.message, 'error');
    }
}

function showAlert(message, type = 'info') {
    console.log('Alert:', type, message);
    
    const alert = document.getElementById('admin-alert');
    if (alert) {
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
}

// Make functions global for onclick handlers
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;