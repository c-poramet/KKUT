// Bus Route Data Collection App
// Author: GitHub Copilot for Poramet
// Mobile-first field data collection tool

class BusRouteLogger {
    constructor() {
        this.entries = [];
        this.currentEntry = {};
        this.isOnline = navigator.onLine;
        this.pickers = {};
        this.selectedValues = {
            route: '',
            stopLetter: '',
            stopNumber: '',
            weather: '',
            editRoute: '',
            editStopLetter: '',
            editStopNumber: '',
            editWeather: ''
        };
        
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupScrollPickers();
        this.setupEventListeners();
        this.startClock();
        this.updateOnlineStatus();
        this.renderTable();
        this.updateArrivedButton();
    }

    // Scroll Picker Setup
    setupScrollPickers() {
        // Main route picker
        this.setupPicker('route-list', 'route', (value) => {
            this.selectedValues.route = value;
            this.updateArrivedButton();
            this.saveSetupToStorage();
        });

        // Stop pickers - generate numbers 1-30
        this.populateStopNumbers('stop-number-list');
        this.setupPicker('stop-letter-list', 'stopLetter', (value) => {
            this.selectedValues.stopLetter = value;
        });
        this.setupPicker('stop-number-list', 'stopNumber', (value) => {
            this.selectedValues.stopNumber = value;
        });

        // Weather picker
        this.setupPicker('weather-list', 'weather', (value) => {
            this.selectedValues.weather = value;
        });

        // Edit modal pickers
        this.populateStopNumbers('edit-stop-number-list');
        this.setupPicker('edit-route-list', 'editRoute', (value) => {
            this.selectedValues.editRoute = value;
        });
        this.setupPicker('edit-stop-letter-list', 'editStopLetter', (value) => {
            this.selectedValues.editStopLetter = value;
        });
        this.setupPicker('edit-stop-number-list', 'editStopNumber', (value) => {
            this.selectedValues.editStopNumber = value;
        });
        this.setupPicker('edit-weather-list', 'editWeather', (value) => {
            this.selectedValues.editWeather = value;
        });
    }

    populateStopNumbers(listId) {
        const list = document.getElementById(listId);
        if (!list) return;
        
        // Clear existing numbers except first item (which might be empty)
        const firstItem = list.firstElementChild;
        list.innerHTML = '';
        if (firstItem && firstItem.dataset.value === '') {
            list.appendChild(firstItem);
        }
        
        // Add numbers 1-30
        for (let i = 1; i <= 30; i++) {
            const item = document.createElement('div');
            item.className = 'picker-item';
            item.dataset.value = i.toString();
            item.textContent = i.toString();
            list.appendChild(item);
        }
    }

    setupPicker(listId, valueKey, onChange) {
        const list = document.getElementById(listId);
        if (!list) return;

        const container = list.parentElement;
        
        // Handle scroll events to snap to center
        let scrollTimeout;
        list.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.snapToCenter(list, valueKey, onChange);
            }, 150);
        });

        // Handle touch/click events
        list.addEventListener('click', (e) => {
            if (e.target.classList.contains('picker-item')) {
                this.selectPickerItem(list, e.target, valueKey, onChange);
            }
        });

        // Initial selection
        const firstItem = list.querySelector('.picker-item[data-value]:not([data-value=\"\"])');
        if (firstItem && !this.selectedValues[valueKey]) {
            this.selectPickerItem(list, firstItem, valueKey, onChange, false);
        }
    }

    selectPickerItem(list, item, valueKey, onChange, scroll = true) {
        // Remove previous selection
        list.querySelectorAll('.picker-item').forEach(i => {
            i.classList.remove('selected', 'snap-center');
        });

        // Select new item
        item.classList.add('selected');
        this.selectedValues[valueKey] = item.dataset.value;

        // Scroll to center the item
        if (scroll) {
            const itemTop = item.offsetTop;
            const listHeight = list.clientHeight;
            const itemHeight = item.offsetHeight;
            const scrollTop = itemTop - (listHeight / 2) + (itemHeight / 2);
            
            list.scrollTo({
                top: scrollTop,
                behavior: 'smooth'
            });
        }

        if (onChange) {
            onChange(item.dataset.value);
        }
    }

    snapToCenter(list, valueKey, onChange) {
        const listRect = list.getBoundingClientRect();
        const centerY = listRect.top + listRect.height / 2;
        
        let closestItem = null;
        let closestDistance = Infinity;
        
        list.querySelectorAll('.picker-item').forEach(item => {
            const itemRect = item.getBoundingClientRect();
            const itemCenterY = itemRect.top + itemRect.height / 2;
            const distance = Math.abs(centerY - itemCenterY);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestItem = item;
            }
        });
        
        if (closestItem) {
            this.selectPickerItem(list, closestItem, valueKey, onChange, true);
        }
    }

    getPickerValue(listId) {
        const list = document.getElementById(listId);
        const selected = list?.querySelector('.picker-item.selected');
        return selected?.dataset.value || '';
    }

    setPickerValue(listId, value) {
        const list = document.getElementById(listId);
        if (!list) return;
        
        const item = list.querySelector(`[data-value="${value}"]`);
        if (item) {
            const valueKey = this.getValueKeyForList(listId);
            if (valueKey) {
                this.selectPickerItem(list, item, valueKey, null, true);
            }
        }
    }

    getValueKeyForList(listId) {
        const mapping = {
            'route-list': 'route',
            'stop-letter-list': 'stopLetter',
            'stop-number-list': 'stopNumber',
            'weather-list': 'weather',
            'edit-route-list': 'editRoute',
            'edit-stop-letter-list': 'editStopLetter',
            'edit-stop-number-list': 'editStopNumber',
            'edit-weather-list': 'editWeather'
        };
        return mapping[listId];
    }

    // Event Listeners
    setupEventListeners() {
        // Plate input
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
        const route = this.selectedValues.route;
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
            route: this.selectedValues.route,
            plate: document.getElementById('plate-input').value
        };
        localStorage.setItem('busRouteSetup', JSON.stringify(setup));
    }

    loadSetupFromStorage() {
        const saved = localStorage.getItem('busRouteSetup');
        if (saved) {
            const setup = JSON.parse(saved);
            if (setup.route) {
                this.setPickerValue('route-list', setup.route);
            }
            document.getElementById('plate-input').value = setup.plate || '';
        }
    }

    // Entry Management
    handleArrival() {
        const route = this.selectedValues.route;
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
        // Reset stop pickers to first valid selection
        this.setPickerValue('stop-letter-list', 'B');
        this.setPickerValue('stop-number-list', '1');
        this.setPickerValue('weather-list', '');
        document.getElementById('notes-input').value = '';
    }

    saveCurrentEntry() {
        const stopLetter = this.selectedValues.stopLetter;
        const stopNumber = this.selectedValues.stopNumber;
        
        if (!stopLetter || !stopNumber) {
            alert('Please select both stop letter and number!');
            return;
        }

        const stop = stopLetter + stopNumber;

        // Update current entry
        this.currentEntry.stop = stop;
        this.currentEntry.weather = this.selectedValues.weather;
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

    // Helper Methods
    getCurrentStopId() {
        const letter = this.selectedValues.stopLetter;
        const number = this.selectedValues.stopNumber;
        return (letter && number) ? letter + number : '';
    }

    getCurrentEditStopId() {
        const letter = this.selectedValues.editStopLetter;
        const number = this.selectedValues.editStopNumber;
        return (letter && number) ? letter + number : '';
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
        
        // Set picker values
        this.setPickerValue('edit-route-list', entry.route);
        
        // Parse stop ID (e.g., "B15" -> letter="B", number="15")
        const stopMatch = entry.stop.match(/^([A-Z])(\d+)$/);
        if (stopMatch) {
            this.setPickerValue('edit-stop-letter-list', stopMatch[1]);
            this.setPickerValue('edit-stop-number-list', stopMatch[2]);
        }
        
        this.setPickerValue('edit-weather-list', entry.weather);
        
        document.getElementById('edit-plate').value = entry.plate;
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
        
        const stopLetter = this.selectedValues.editStopLetter;
        const stopNumber = this.selectedValues.editStopNumber;
        
        if (!stopLetter || !stopNumber) {
            alert('Please select both stop letter and number!');
            return;
        }

        const stop = stopLetter + stopNumber;
        
        // Update entry
        const timestamp = new Date(document.getElementById('edit-timestamp').value);
        this.entries[entryIndex] = {
            ...this.entries[entryIndex],
            timestamp: timestamp.toISOString(),
            route: this.selectedValues.editRoute,
            plate: document.getElementById('edit-plate').value.toUpperCase(),
            stop: stop,
            weather: this.selectedValues.editWeather,
            notes: document.getElementById('edit-notes').value.trim()
        };
        
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
            
            // Load setup
            this.loadSetupFromStorage();
        } catch (e) {
            console.error('Failed to load from storage:', e);
            this.entries = [];
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