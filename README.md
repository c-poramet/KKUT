# Bus Route Data Collection App

A minimal, mobile-first web app for field data collection of college bus routes. Built for Poramet to use while physically on the bus.

## Features

- **Fast Logging**: One-press arrival time logging with precise timestamps
- **Mobile-First Design**: Optimized for one-handed use on mobile devices
- **Offline Capability**: Works without internet connection using localStorage
- **Real-time Data Review**: Live table showing all logged entries
- **Data Export**: Export to CSV or JSON formats
- **Persistent Storage**: Saves route and plate number between sessions

## Usage

1. **Setup**: Select route color and enter bus plate number
2. **At Each Stop**: Press the "ARRIVED" button when the bus stops
3. **Quick Entry**: Enter stop ID and optional weather/notes
4. **Review Data**: Check the live table for accuracy
5. **Export**: Download data as CSV or JSON when needed

## Data Fields

- Timestamp (auto-filled, precise to seconds)
- Route ID (Red/Yellow/Blue/Green)
- Bus plate number (persistent across entries)
- Stop ID (with auto-suggestions)
- Weather (optional: clear/cloudy/rain/storm/fog)
- Notes (optional free text)

## Technical Details

- **Offline-First**: Uses localStorage and service worker
- **Progressive Web App**: Installable on mobile devices
- **No Backend Required**: Runs entirely in the browser
- **Responsive Design**: Works on all screen sizes
- **Keyboard Shortcuts**: Space/Enter to log arrival, Escape to close modals

## Files

- `index.html` - Main application structure
- `style.css` - Mobile-first responsive styles
- `script.js` - Application logic and data management
- `manifest.json` - PWA configuration
- `sw.js` - Service worker for offline functionality

## Installation

1. Open the app in a mobile browser
2. Add to home screen when prompted
3. Use like a native app

## Data Management

- Data is saved automatically in browser storage
- Export options available for backup
- Duplicate stop warnings (but allows override)
- Edit and delete individual entries
- Clear all data option with confirmation

## Browser Support

Works in all modern mobile browsers that support:
- localStorage
- Service Workers
- CSS Grid/Flexbox
- ES6+ JavaScript features

Built with ❤️ by GitHub Copilot for efficient field data collection.