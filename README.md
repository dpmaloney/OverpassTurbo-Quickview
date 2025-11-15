# OverpassTurbo-Quickview

A Chrome browser extension that enhances [Overpass Turbo](https://overpass-turbo.eu/) with integrated Google Maps and Street View capabilities, making it easy to quickly scan and visualize large numbers of OpenStreetMap query results.

## Features

- **In-Page Viewer**: Opens Google Maps and Street View directly within the Overpass Turbo page
- **Quick View Buttons**: Automatically adds "View" buttons to query results
- **Keyboard Shortcuts**:
  - `V` - Open viewer for selected result
  - `M` - Switch to Google Maps view (when viewer is open)
  - `S` - Switch to Street View (when viewer is open)
  - `Esc` - Close the viewer
- **Dual View Modes**: Toggle between Google Maps and Street View with a single click
- **Coordinate Display**: Shows precise lat/lon coordinates for the current location

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the project directory

## Usage

1. Navigate to [Overpass Turbo](https://overpass-turbo.eu/)
2. Run any query that returns location-based results
3. Look for the "🗺️ View" button next to results
4. Click the button or press `V` to open the in-page viewer
5. Toggle between Maps and Street View using the tabs or keyboard shortcuts

## Technical Details

- **Platform**: Chrome Extension (Manifest V3)
- **Languages**: JavaScript (vanilla), HTML, CSS
- **Content Script**: Injects viewer functionality into Overpass Turbo pages
- **Permissions**: activeTab, storage, overpass-turbo.eu, google.com

## Development

See [CLAUDE.md](CLAUDE.md) for detailed development guidelines and architectural information.

## License

MIT