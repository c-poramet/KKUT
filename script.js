// Thai Bus Route Logger
// Developer tool for precise bus arrival data collection
// Timezone: UTC+7 (Thailand)

class ThaiBusLogger {
    constructor() {
        this.entries = [];
        this.tripData = {
            route: '',
            plate: '',
            weather: '',
            currentStop: 1,
            isActive: false
        };
        
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.startClock();
        this.renderTable();
        this.showSetupPhase();
    }

    // Event Listeners
    setupEventListeners() {
        // Setup Phase
        document.getElementById('route-select').addEventListener('change', () => {
            this.updateStartButton();
        });
        
        document.getElementById('start-trip-btn').addEventListener('click', () => {
            this.startTrip();
        });

        // Logging Phase Controls
        document.getElementById('skip-btn').addEventListener('click', () => {
            this.skipStop();
        });
        
        document.getElementById('back-btn').addEventListener('click', () => {
            this.goBackStop();
        });
        
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.confirmResetTrip();
        });

        // Done Button
        document.getElementById('done-btn').addEventListener('click', () => {
            this.logCurrentStop();
        });

        // Data Export and Management
        document.getElementById('export-csv-btn').addEventListener('click', () => {
            this.exportCSV();
        });
        
        document.getElementById('export-json-btn').addEventListener('click', () => {
            this.exportJSON();
        });
        
        document.getElementById('clear-all-btn').addEventListener('click', () => {
            this.confirmClearAll();
        });

        // Edit Modal
        document.getElementById('close-edit-modal').addEventListener('click', () => {
            this.hideEditModal();
        });
        
        document.getElementById('cancel-edit-btn').addEventListener('click', () => {
            this.hideEditModal();
        });
        
        document.getElementById('save-edit-btn').addEventListener('click', () => {
            this.saveEditedEntry();
        });
        
        document.getElementById('delete-entry-btn').addEventListener('click', () => {
            this.confirmDeleteEntry();
        });

        // Confirmation Dialog
        document.getElementById('confirm-ok').addEventListener('click', () => {
            this.handleConfirmation(true);
        });
        
        document.getElementById('confirm-cancel').addEventListener('click', () => {
            this.handleConfirmation(false);
        });

        // Click outside modal to close
        document.getElementById('confirm-dialog').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hideConfirmDialog();
            }
        });
        
        document.getElementById('edit-modal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hideEditModal();
            }
        });
    }

    // Time Display (Thai Timezone)
    startClock() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }

    updateClock() {
        const timeString = new Date().toLocaleTimeString('th-TH', {
            timeZone: 'Asia/Bangkok',
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('current-time').textContent = timeString;
    }

    getThaiTimestamp() {
        // Get current time in Thai timezone and return ISO string
        const now = new Date();
        const thaiTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Bangkok"}));
        return thaiTime.toISOString();
    }

    formatThaiTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString('th-TH', {
            timeZone: 'Asia/Bangkok',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    }

    // Phase Management
    showSetupPhase() {
        document.getElementById('setup-phase').classList.remove('hidden');
        document.getElementById('logging-phase').classList.add('hidden');
        this.updateTripStatus('Setup Phase');
    }

    showLoggingPhase() {
        document.getElementById('setup-phase').classList.add('hidden');
        document.getElementById('logging-phase').classList.remove('hidden');
        this.updateTripStatus(`${this.tripData.route} Line - Stop ${this.tripData.currentStop}`);
        this.updateStopTile();
        this.renderTable(); // Ensure data table is visible
    }

    updateTripStatus(text) {
        document.getElementById('trip-status').textContent = text;
    }

    updateStartButton() {
        const route = document.getElementById('route-select').value;
        const startBtn = document.getElementById('start-trip-btn');
        
        startBtn.disabled = !route;
    }

    startTrip() {
        const route = document.getElementById('route-select').value;
        if (!route) return;

        this.tripData = {
            route: route,
            plate: document.getElementById('plate-input').value.trim() || '',
            weather: document.getElementById('weather-select').value || '',
            currentStop: 1,
            isActive: true
        };

        this.saveToStorage();
        this.showLoggingPhase();
    }

    // Stop Management
    updateStopTile() {
        const stopTile = document.getElementById('stop-tile');
        const stopLabel = document.getElementById('stop-label');
        
        // Generate stop ID (e.g., R1, Y15, B3, G7)
        const stopId = this.tripData.route.charAt(0) + this.tripData.currentStop;
        stopLabel.textContent = stopId;
        
        // Update tile color
        stopTile.className = `stop-tile route-${this.tripData.route}`;
        
        // Update back button state
        document.getElementById('back-btn').disabled = this.tripData.currentStop <= 1;
    }

    skipStop() {
        this.tripData.currentStop++;
        this.updateStopTile();
        this.updateTripStatus(`${this.tripData.route} Line - Stop ${this.tripData.currentStop}`);
        this.clearStopForm();
        this.saveToStorage();
    }

    goBackStop() {
        if (this.tripData.currentStop > 1) {
            this.tripData.currentStop--;
            this.updateStopTile();
            this.updateTripStatus(`${this.tripData.route} Line - Stop ${this.tripData.currentStop}`);
            this.clearStopForm();
            this.saveToStorage();
        }
    }

    clearStopForm() {
        // Clear radio buttons
        const radios = document.querySelectorAll('input[name="stop-status"]');
        radios.forEach(radio => radio.checked = false);
        
        // Clear notes
        document.getElementById('notes-input').value = '';
    }

    // Entry Logging
    logCurrentStop() {
        const stopStatus = document.querySelector('input[name="stop-status"]:checked');
        
        if (!stopStatus) {
            alert('Please select stop status (picked up or passed)');
            return;
        }

        const notes = document.getElementById('notes-input').value.trim();
        const stopId = this.tripData.route.charAt(0) + this.tripData.currentStop;

        // Create entry with Thai timestamp
        const entry = {
            id: Date.now() + Math.random(),
            timestamp: this.getThaiTimestamp(),
            route: this.tripData.route,
            plate: this.tripData.plate,
            stopId: stopId,
            stopNumber: this.tripData.currentStop,
            status: stopStatus.value,
            weather: this.tripData.weather,
            notes: notes
        };

        // Add to entries
        this.entries.push(entry);
        
        // Move to next stop
        this.tripData.currentStop++;
        
        // Update UI
        this.updateStopTile();
        this.updateTripStatus(`${this.tripData.route} Line - Stop ${this.tripData.currentStop}`);
        this.clearStopForm();
        
        // Save and render
        this.saveToStorage();
        this.renderTable();
        
        // Show brief success indication
        this.showSuccessMessage(`${stopId} logged: ${stopStatus.value.replace('-', ' ')}`);
    }

    // UI Feedback
    showSuccessMessage(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: #28a745;
            color: white;
            padding: 0.6rem 1rem;
            border-radius: 6px;
            z-index: 2000;
            font-size: 0.9rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }

    // Confirmation Dialog
    confirmResetTrip() {
        this.showConfirmDialog(
            'Reset Trip',
            'This will end the current trip and return to setup. All unsaved progress will be lost.',
            'reset-trip'
        );
    }

    showConfirmDialog(title, message, action) {
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        document.getElementById('confirm-dialog').setAttribute('data-action', action);
        document.getElementById('confirm-dialog').classList.remove('hidden');
    }

    hideConfirmDialog() {
        document.getElementById('confirm-dialog').classList.add('hidden');
        document.getElementById('confirm-dialog').removeAttribute('data-action');
    }

    handleConfirmation(confirmed) {
        const action = document.getElementById('confirm-dialog').getAttribute('data-action');
        this.hideConfirmDialog();

        if (confirmed) {
            if (action === 'reset-trip') {
                this.resetTrip();
            } else if (action === 'clear-all-data') {
                this.clearAllData();
            } else if (action.startsWith('delete-entry-')) {
                const id = action.replace('delete-entry-', '');
                this.deleteEntry(id);
            }
        }
    }

    resetTrip() {
        this.tripData = {
            route: '',
            plate: '',
            weather: '',
            currentStop: 1,
            isActive: false
        };
        
        // Reset form
        document.getElementById('route-select').value = '';
        document.getElementById('plate-input').value = '';
        document.getElementById('weather-select').value = '';
        
        this.saveToStorage();
        this.showSetupPhase();
    }

    // Table Rendering
    renderTable() {
        const tbody = document.getElementById('data-tbody');
        const noData = document.getElementById('no-data');
        const count = document.getElementById('entries-count');
        
        // Update count
        count.textContent = `${this.entries.length} entries`;
        
        if (this.entries.length === 0) {
            tbody.innerHTML = '';
            noData.classList.remove('hidden');
            return;
        }
        
        noData.classList.add('hidden');
        
        // Sort entries by timestamp (newest first)
        const sortedEntries = [...this.entries].sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        tbody.innerHTML = sortedEntries.map(entry => {
            const timeStr = new Date(entry.timestamp).toLocaleTimeString('th-TH', {
                timeZone: 'Asia/Bangkok',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            
            const statusClass = `status-${entry.status.replace('-', '-')}`;
            const statusText = entry.status === 'picked-up' ? 'Picked up' : 'Passed';
            
            return `
                <tr>
                    <td class="font-mono">${timeStr}</td>
                    <td><strong>${entry.stopId || 'N/A'}</strong></td>
                    <td><span class="${statusClass}">${statusText}</span></td>
                    <td class="notes-cell" title="${entry.notes || ''}">${entry.notes || ''}</td>
                    <td>
                        <button class="edit-btn" onclick="app.editEntry('${entry.id}')" title="Edit Entry">
                            ✏️
                        </button>
                        <button class="edit-btn" onclick="app.deleteEntryQuick('${entry.id}')" title="Delete Entry" style="color: #dc3545; margin-left: 4px;">
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Table Rendering
    renderTable() {
        const tbody = document.getElementById('data-tbody');
        const noData = document.getElementById('no-data');
        const count = document.getElementById('entries-count');
        
        // Update count
        count.textContent = `${this.entries.length} entries`;
        
        if (this.entries.length === 0) {
            tbody.innerHTML = '';
            noData.classList.remove('hidden');
            return;
        }
        
        noData.classList.add('hidden');
        
        // Sort entries by timestamp (newest first)
        const sortedEntries = [...this.entries].sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        tbody.innerHTML = sortedEntries.map((entry, index) => {
            const time = new Date(entry.timestamp);
            const timeStr = time.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            
            const weatherIcon = this.getWeatherIcon(entry.weather);
            
            return `
                <tr>
                    <td title="${time.toLocaleString()}">${timeStr}</td>
                    <td><span class="route-badge route-${entry.route}">${entry.route}</span></td>
                    <td>${entry.plate}</td>
                    <td><strong>${entry.stop}</strong></td>
                    <td><span class="weather-icon">${weatherIcon}</span></td>
                    <td class="notes-cell" title="${entry.notes}">${entry.notes}</td>
                    <td class="action-buttons">
                        <button class="btn btn-outline btn-sm" onclick="app.editEntry('${entry.id}')" title="Edit">✏️</button>
                        <button class="btn btn-danger btn-sm" onclick="app.deleteEntry('${entry.id}')" title="Delete">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Entry Management
    editEntry(id) {
        const entry = this.entries.find(e => e.id == id);
        if (!entry) return;
        
        // Populate edit form
        document.getElementById('edit-stop-id').value = entry.stopId || '';
        document.getElementById('edit-status').value = entry.status;
        document.getElementById('edit-notes').value = entry.notes || '';
        
        // Store current editing ID
        this.currentEditId = id;
        
        // Show edit modal
        this.showEditModal();
    }
    
    showEditModal() {
        document.getElementById('edit-modal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    hideEditModal() {
        document.getElementById('edit-modal').classList.add('hidden');
        document.body.style.overflow = '';
        this.currentEditId = null;
    }
    
    saveEditedEntry() {
        if (!this.currentEditId) return;
        
        const entry = this.entries.find(e => e.id == this.currentEditId);
        if (!entry) return;
        
        // Update entry
        entry.status = document.getElementById('edit-status').value;
        entry.notes = document.getElementById('edit-notes').value.trim();
        
        this.saveToStorage();
        this.renderTable();
        this.hideEditModal();
        this.showSuccessMessage('Entry updated successfully');
    }
    
    deleteEntryQuick(id) {
        this.showConfirmDialog(
            'Delete Entry',
            'Are you sure you want to delete this entry? This action cannot be undone.',
            `delete-entry-${id}`
        );
    }
    
    confirmDeleteEntry() {
        if (!this.currentEditId) return;
        
        this.showConfirmDialog(
            'Delete Entry',
            'Are you sure you want to delete this entry? This action cannot be undone.',
            `delete-entry-${this.currentEditId}`
        );
    }
    
    deleteEntry(id) {
        this.entries = this.entries.filter(e => e.id != id);
        this.saveToStorage();
        this.renderTable();
        this.hideEditModal();
        this.showSuccessMessage('Entry deleted successfully');
    }
    
    confirmClearAll() {
        if (this.entries.length === 0) {
            alert('No data to clear');
            return;
        }
        
        this.showConfirmDialog(
            'Clear All Data',
            `This will delete all ${this.entries.length} entries permanently. This action cannot be undone.`,
            'clear-all-data'
        );
    }
    
    clearAllData() {
        this.entries = [];
        this.saveToStorage();
        this.renderTable();
        this.showSuccessMessage('All data cleared successfully');
    }

    // Data Export
    exportCSV() {
        if (this.entries.length === 0) {
            alert('No data to export');
            return;
        }

        const headers = ['Timestamp', 'Route', 'Plate', 'Stop', 'Status', 'Weather', 'Notes'];
        const rows = this.entries.map(entry => {
            return [
                this.formatThaiTime(entry.timestamp),
                entry.route,
                entry.plate || '',
                entry.stopId || '',
                entry.status === 'picked-up' ? 'Stopped to pick up' : 'Passed without picking up',
                entry.weather || '',
                entry.notes || ''
            ];
        });
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
        
        this.downloadFile(csvContent, this.getExportFilename('csv'), 'text/csv');
    }

    exportJSON() {
        if (this.entries.length === 0) {
            alert('No data to export');
            return;
        }

        const data = {
            exportMetadata: {
                exportDate: this.formatThaiTime(this.getThaiTimestamp()),
                timezone: 'Asia/Bangkok (UTC+7)',
                totalEntries: this.entries.length
            },
            tripData: this.tripData,
            entries: this.entries.map(entry => ({
                ...entry,
                thaiTimeFormatted: this.formatThaiTime(entry.timestamp)
            }))
        };
        
        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, this.getExportFilename('json'), 'application/json');
    }

    getExportFilename(extension) {
        const now = new Date();
        const thaiDate = now.toLocaleDateString('th-TH', {
            timeZone: 'Asia/Bangkok',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\//g, '-');
        
        const route = this.tripData.route || 'unknown';
        return `thai-bus-${route.toLowerCase()}-${thaiDate}.${extension}`;
    }

    exportCSV() {
        const headers = ['Timestamp', 'Route', 'Plate', 'Stop', 'Weather', 'Notes'];
        const rows = this.entries.map(entry => [
            entry.timestamp,
            entry.route,
            entry.plate,
            entry.stop,
            entry.weather || '',
            entry.notes || ''
        ]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
        
        this.downloadFile(csvContent, 'bus-route-data.csv', 'text/csv');
    }

    exportJSON() {
        const data = {
            exportDate: new Date().toISOString(),
            totalEntries: this.entries.length,
            entries: this.entries
        };
        
        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, 'bus-route-data.json', 'application/json');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSuccessMessage(`Exported: ${filename}`);
    }

    // Storage Management
    saveToStorage() {
        try {
            localStorage.setItem('thaiBusEntries', JSON.stringify(this.entries));
            localStorage.setItem('thaiBusTripData', JSON.stringify(this.tripData));
        } catch (e) {
            console.error('Failed to save to storage:', e);
            alert('Warning: Failed to save data locally');
        }
    }

    loadFromStorage() {
        try {
            // Load entries
            const entries = localStorage.getItem('thaiBusEntries');
            if (entries) {
                this.entries = JSON.parse(entries);
            }
            
            // Load trip data
            const tripData = localStorage.getItem('thaiBusTripData');
            if (tripData) {
                const saved = JSON.parse(tripData);
                this.tripData = { ...this.tripData, ...saved };
                
                // Restore setup form if trip is active
                if (this.tripData.isActive) {
                    document.getElementById('route-select').value = this.tripData.route;
                    document.getElementById('plate-input').value = this.tripData.plate;
                    document.getElementById('weather-select').value = this.tripData.weather;
                    this.showLoggingPhase();
                } else {
                    // Restore setup form values but stay in setup phase
                    document.getElementById('route-select').value = this.tripData.route || '';
                    document.getElementById('plate-input').value = this.tripData.plate || '';
                    document.getElementById('weather-select').value = this.tripData.weather || '';
                }
            }
        } catch (e) {
            console.error('Failed to load from storage:', e);
            this.entries = [];
            this.tripData = {
                route: '',
                plate: '',
                weather: '',
                currentStop: 1,
                isActive: false
            };
        }
    }
}

// Initialize Thai Bus Logger
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ThaiBusLogger();
});

// Service Worker for offline capability
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}