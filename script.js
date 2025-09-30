// Bus Route Data Collection App
// Author: GitHub Copilot for Poramet
// Mobile-first field data collection tool

class BusRouteLogger {
    constructor() {
        this.entries = [];
        this.currentEntry = {};
        this.stopSuggestions = new Set();
        this.isOnline = navigator.onLine;
        
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.startClock();
        this.updateOnlineStatus();
        this.renderTable();
        this.updateArrivedButton();
        this.populateStopSuggestions();
    }

    // Event Listeners
    setupEventListeners() {
        // Setup form changes
        document.getElementById('route-select').addEventListener('change', () => {
            this.updateArrivedButton();
            this.saveSetupToStorage();
        });
        
        document.getElementById('plate-input').addEventListener('input', () => {
            this.updateArrivedButton();
            this.saveSetupToStorage();
        });

        // Main arrived button
        document.getElementById('arrived-btn').addEventListener('click', () => {
            this.handleArrival();
        });

        // Entry modal
        document.getElementById('save-entry').addEventListener('click', () => {
            this.saveCurrentEntry();
        });
        
        document.getElementById('cancel-entry').addEventListener('click', () => {
            this.hideEntryModal();
        });

        // Edit modal
        document.getElementById('close-edit').addEventListener('click', () => {
            this.hideEditModal();
        });
        
        document.getElementById('cancel-edit').addEventListener('click', () => {
            this.hideEditModal();
        });
        
        document.getElementById('update-entry').addEventListener('click', () => {
            this.updateEntry();
        });

        // Data actions
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.clearAllData();
        });

        // Stop input with suggestions
        const stopInput = document.getElementById('stop-input');
        stopInput.addEventListener('input', (e) => {
            this.addStopSuggestion(e.target.value);
        });

        // Online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateOnlineStatus();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateOnlineStatus();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Space bar or Enter to arrive (when not in input)
            if ((e.code === 'Space' || e.code === 'Enter') && 
                !e.target.matches('input, textarea, select') &&
                !document.getElementById('arrived-btn').disabled) {
                e.preventDefault();
                this.handleArrival();
            }
            
            // Escape to close modals
            if (e.code === 'Escape') {
                this.hideEntryModal();
                this.hideEditModal();
            }
        });

        // Click outside modal to close
        document.getElementById('entry-modal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hideEntryModal();
            }
        });
        
        document.getElementById('edit-modal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hideEditModal();
            }
        });
    }

    // Time and Status
    startClock() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }

    updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('current-time').textContent = timeString;
    }

    updateOnlineStatus() {
        const statusEl = document.getElementById('online-status');
        if (this.isOnline) {
            statusEl.textContent = '📶';
            statusEl.className = 'online';
            statusEl.title = 'Online';
        } else {
            statusEl.textContent = '📵';
            statusEl.className = 'offline';
            statusEl.title = 'Offline';
        }
    }

    // Setup Management
    updateArrivedButton() {
        const route = document.getElementById('route-select').value;
        const plate = document.getElementById('plate-input').value.trim();
        const arrivedBtn = document.getElementById('arrived-btn');
        
        if (route && plate) {
            arrivedBtn.disabled = false;
            arrivedBtn.style.cursor = 'pointer';
        } else {
            arrivedBtn.disabled = true;
            arrivedBtn.style.cursor = 'not-allowed';
        }
    }

    saveSetupToStorage() {
        const setup = {
            route: document.getElementById('route-select').value,
            plate: document.getElementById('plate-input').value
        };
        localStorage.setItem('busRouteSetup', JSON.stringify(setup));
    }

    loadSetupFromStorage() {
        const saved = localStorage.getItem('busRouteSetup');
        if (saved) {
            const setup = JSON.parse(saved);
            document.getElementById('route-select').value = setup.route || '';
            document.getElementById('plate-input').value = setup.plate || '';
        }
    }

    // Entry Management
    handleArrival() {
        const route = document.getElementById('route-select').value;
        const plate = document.getElementById('plate-input').value.trim();
        
        if (!route || !plate) {
            alert('Please select route and enter plate number first!');
            return;
        }

        // Create new entry with precise timestamp
        const now = new Date();
        this.currentEntry = {
            id: Date.now() + Math.random(), // Unique ID
            timestamp: now.toISOString(),
            route: route,
            plate: plate.toUpperCase(),
            stop: '',
            weather: '',
            notes: ''
        };

        // Show timestamp in modal
        document.getElementById('entry-timestamp').textContent = 
            now.toLocaleString('en-US', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });

        // Reset and show modal
        this.resetEntryModal();
        this.showEntryModal();
        
        // Focus on stop input
        setTimeout(() => {
            document.getElementById('stop-input').focus();
        }, 100);
    }

    showEntryModal() {
        document.getElementById('entry-modal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    hideEntryModal() {
        document.getElementById('entry-modal').classList.add('hidden');
        document.body.style.overflow = '';
        this.currentEntry = {};
    }

    resetEntryModal() {
        document.getElementById('stop-input').value = '';
        document.getElementById('weather-select').value = '';
        document.getElementById('notes-input').value = '';
    }

    saveCurrentEntry() {
        const stop = document.getElementById('stop-input').value.trim();
        
        if (!stop) {
            alert('Stop ID is required!');
            document.getElementById('stop-input').focus();
            return;
        }

        // Update current entry
        this.currentEntry.stop = stop.toUpperCase();
        this.currentEntry.weather = document.getElementById('weather-select').value;
        this.currentEntry.notes = document.getElementById('notes-input').value.trim();

        // Check for duplicate stop (warn but allow)
        const duplicates = this.entries.filter(entry => 
            entry.stop === this.currentEntry.stop && 
            entry.route === this.currentEntry.route &&
            Math.abs(new Date(entry.timestamp) - new Date(this.currentEntry.timestamp)) < 300000 // 5 minutes
        );

        if (duplicates.length > 0) {
            if (!confirm(`Warning: Stop ${stop} was already logged recently on ${this.currentEntry.route} route. Continue anyway?`)) {
                return;
            }
        }

        // Add to entries
        this.entries.push({ ...this.currentEntry });
        
        // Update suggestions
        this.addStopSuggestion(this.currentEntry.stop);
        
        // Save and update UI
        this.saveToStorage();
        this.renderTable();
        this.hideEntryModal();
        
        // Show success feedback
        this.showSuccessMessage(`Entry saved: ${this.currentEntry.stop} at ${new Date(this.currentEntry.timestamp).toLocaleTimeString()}`);
    }

    showSuccessMessage(message) {
        // Simple success notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            z-index: 2000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Stop Suggestions
    addStopSuggestion(stop) {
        if (stop && stop.trim()) {
            this.stopSuggestions.add(stop.trim().toUpperCase());
            this.populateStopSuggestions();
        }
    }

    populateStopSuggestions() {
        const datalist = document.getElementById('stop-suggestions');
        datalist.innerHTML = '';
        
        // Add unique stops from existing entries
        const existingStops = [...new Set(this.entries.map(e => e.stop))];
        existingStops.forEach(stop => {
            if (stop) this.stopSuggestions.add(stop);
        });
        
        // Populate datalist
        [...this.stopSuggestions].sort().forEach(stop => {
            const option = document.createElement('option');
            option.value = stop;
            datalist.appendChild(option);
        });
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

    getWeatherIcon(weather) {
        const icons = {
            clear: '☀️',
            cloudy: '☁️',
            rain: '🌧️',
            storm: '⛈️',
            fog: '🌫️'
        };
        return icons[weather] || '';
    }

    // Edit Entry
    editEntry(id) {
        const entry = this.entries.find(e => e.id == id);
        if (!entry) return;
        
        // Populate edit form
        const timestamp = new Date(entry.timestamp);
        document.getElementById('edit-timestamp').value = 
            timestamp.toISOString().slice(0, -1); // Remove Z for datetime-local
        document.getElementById('edit-route').value = entry.route;
        document.getElementById('edit-plate').value = entry.plate;
        document.getElementById('edit-stop').value = entry.stop;
        document.getElementById('edit-weather').value = entry.weather;
        document.getElementById('edit-notes').value = entry.notes;
        
        // Store current editing ID
        this.editingId = id;
        
        // Show modal
        this.showEditModal();
    }

    showEditModal() {
        document.getElementById('edit-modal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    hideEditModal() {
        document.getElementById('edit-modal').classList.add('hidden');
        document.body.style.overflow = '';
        this.editingId = null;
    }

    updateEntry() {
        if (!this.editingId) return;
        
        const entryIndex = this.entries.findIndex(e => e.id == this.editingId);
        if (entryIndex === -1) return;
        
        const stop = document.getElementById('edit-stop').value.trim();
        if (!stop) {
            alert('Stop ID is required!');
            return;
        }
        
        // Update entry
        const timestamp = new Date(document.getElementById('edit-timestamp').value);
        this.entries[entryIndex] = {
            ...this.entries[entryIndex],
            timestamp: timestamp.toISOString(),
            route: document.getElementById('edit-route').value,
            plate: document.getElementById('edit-plate').value.toUpperCase(),
            stop: stop.toUpperCase(),
            weather: document.getElementById('edit-weather').value,
            notes: document.getElementById('edit-notes').value.trim()
        };
        
        // Update suggestions
        this.addStopSuggestion(this.entries[entryIndex].stop);
        
        // Save and update
        this.saveToStorage();
        this.renderTable();
        this.hideEditModal();
        
        this.showSuccessMessage('Entry updated successfully!');
    }

    // Delete Entry
    deleteEntry(id) {
        if (!confirm('Are you sure you want to delete this entry?')) return;
        
        this.entries = this.entries.filter(e => e.id != id);
        this.saveToStorage();
        this.renderTable();
        
        this.showSuccessMessage('Entry deleted successfully!');
    }

    // Data Export
    exportData() {
        if (this.entries.length === 0) {
            alert('No data to export!');
            return;
        }
        
        // Create export options
        const format = prompt('Export format:\n1. CSV\n2. JSON\n\nEnter 1 or 2:', '1');
        
        if (format === '1') {
            this.exportCSV();
        } else if (format === '2') {
            this.exportJSON();
        }
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
        
        this.showSuccessMessage(`Data exported as ${filename}`);
    }

    // Data Management
    clearAllData() {
        if (!confirm('Are you sure you want to clear ALL data? This cannot be undone!')) return;
        
        this.entries = [];
        this.saveToStorage();
        this.renderTable();
        
        this.showSuccessMessage('All data cleared!');
    }

    // Storage
    saveToStorage() {
        try {
            localStorage.setItem('busRouteEntries', JSON.stringify(this.entries));
            localStorage.setItem('busRouteStops', JSON.stringify([...this.stopSuggestions]));
        } catch (e) {
            console.error('Failed to save to storage:', e);
            alert('Warning: Failed to save data locally. Your data may be lost if you close the app.');
        }
    }

    loadFromStorage() {
        try {
            const entries = localStorage.getItem('busRouteEntries');
            if (entries) {
                this.entries = JSON.parse(entries);
            }
            
            const stops = localStorage.getItem('busRouteStops');
            if (stops) {
                this.stopSuggestions = new Set(JSON.parse(stops));
            }
            
            // Load setup
            this.loadSetupFromStorage();
        } catch (e) {
            console.error('Failed to load from storage:', e);
            this.entries = [];
            this.stopSuggestions = new Set();
        }
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new BusRouteLogger();
});

// Service Worker registration for offline capability
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}