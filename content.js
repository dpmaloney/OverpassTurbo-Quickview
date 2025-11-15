// OverpassTurbo-Quickview Content Script
// Injects viewer functionality into Overpass Turbo pages

(function() {
  'use strict';

  let viewerModal = null;
  let currentCoordinates = null;

  // Initialize the extension
  function init() {
    console.log('OverpassTurbo-Quickview: Initializing...');

    // Wait for Overpass Turbo to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setup);
    } else {
      setup();
    }
  }

  function setup() {
    // Create the viewer modal (hidden by default)
    createViewerModal();

    // Add keyboard shortcuts
    setupKeyboardShortcuts();

    // Monitor for result clicks and add view buttons
    setupResultMonitoring();

    console.log('OverpassTurbo-Quickview: Ready');
  }

  // Create the modal viewer UI
  function createViewerModal() {
    viewerModal = document.createElement('div');
    viewerModal.id = 'overpass-quickview-modal';
    viewerModal.className = 'overpass-quickview-hidden';

    viewerModal.innerHTML = `
      <div class="overpass-quickview-overlay"></div>
      <div class="overpass-quickview-container">
        <div class="overpass-quickview-header">
          <div class="overpass-quickview-tabs">
            <button class="overpass-quickview-tab active" data-tab="maps">Google Maps</button>
            <button class="overpass-quickview-tab" data-tab="streetview">Street View</button>
          </div>
          <div class="overpass-quickview-coordinates"></div>
          <button class="overpass-quickview-close" title="Close (Esc)">&times;</button>
        </div>
        <div class="overpass-quickview-content">
          <iframe class="overpass-quickview-frame" id="quickview-frame"></iframe>
        </div>
        <div class="overpass-quickview-footer">
          <span class="overpass-quickview-hint">Press <kbd>Esc</kbd> to close | <kbd>M</kbd> for Maps | <kbd>S</kbd> for Street View</span>
        </div>
      </div>
    `;

    document.body.appendChild(viewerModal);

    // Setup modal event listeners
    viewerModal.querySelector('.overpass-quickview-close').addEventListener('click', closeViewer);
    viewerModal.querySelector('.overpass-quickview-overlay').addEventListener('click', closeViewer);

    // Tab switching
    viewerModal.querySelectorAll('.overpass-quickview-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        switchTab(this.dataset.tab);
      });
    });
  }

  // Setup keyboard shortcuts
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
      // Esc to close
      if (e.key === 'Escape' && !viewerModal.classList.contains('overpass-quickview-hidden')) {
        closeViewer();
        return;
      }

      // Don't trigger shortcuts when typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // V to open viewer with selected result
      if (e.key === 'v' || e.key === 'V') {
        const coords = getSelectedResultCoordinates();
        if (coords) {
          openViewer(coords);
        }
      }

      // M for Maps (when viewer is open)
      if ((e.key === 'm' || e.key === 'M') && !viewerModal.classList.contains('overpass-quickview-hidden')) {
        switchTab('maps');
      }

      // S for Street View (when viewer is open)
      if ((e.key === 's' || e.key === 'S') && !viewerModal.classList.contains('overpass-quickview-hidden')) {
        switchTab('streetview');
      }
    });
  }

  // Monitor Overpass Turbo results and add view buttons
  function setupResultMonitoring() {
    // Use MutationObserver to watch for result changes
    const observer = new MutationObserver(function(mutations) {
      addViewButtons();
    });

    // Observe the entire document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Initial button addition
    setTimeout(addViewButtons, 1000);
  }

  // Add "View" buttons to results
  function addViewButtons() {
    // Overpass Turbo displays results in various ways:
    // 1. Data tab - shows raw data
    // 2. Map view - shows items on map
    // We'll target the data items in the sidebar and selected map features

    // Target data table rows
    const dataRows = document.querySelectorAll('#data_table tbody tr, .element');

    dataRows.forEach(row => {
      // Skip if already has a button
      if (row.querySelector('.overpass-quickview-btn')) {
        return;
      }

      // Extract coordinates from the row
      const coords = extractCoordinatesFromElement(row);
      if (!coords) {
        return;
      }

      // Create view button
      const btn = document.createElement('button');
      btn.className = 'overpass-quickview-btn';
      btn.textContent = '🗺️ View';
      btn.title = 'Open in Maps/Street View (V)';
      btn.dataset.lat = coords.lat;
      btn.dataset.lon = coords.lon;

      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        openViewer({ lat: this.dataset.lat, lon: this.dataset.lon });
      });

      // Insert button
      const firstCell = row.querySelector('td') || row;
      if (firstCell) {
        firstCell.style.position = 'relative';
        firstCell.appendChild(btn);
      }
    });

    // Also add context menu to map popups
    addMapPopupButtons();
  }

  // Add buttons to map popups
  function addMapPopupButtons() {
    const popups = document.querySelectorAll('.leaflet-popup-content');

    popups.forEach(popup => {
      if (popup.querySelector('.overpass-quickview-btn')) {
        return;
      }

      const coords = extractCoordinatesFromPopup(popup);
      if (!coords) {
        return;
      }

      const btn = document.createElement('button');
      btn.className = 'overpass-quickview-btn overpass-quickview-btn-popup';
      btn.textContent = '🗺️ Open in Maps/Street View';
      btn.dataset.lat = coords.lat;
      btn.dataset.lon = coords.lon;

      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        openViewer({ lat: this.dataset.lat, lon: this.dataset.lon });
      });

      popup.appendChild(btn);
    });
  }

  // Extract coordinates from various element types
  function extractCoordinatesFromElement(element) {
    // Try to find lat/lon in the element text or data attributes
    const text = element.textContent || '';

    // Look for coordinate patterns like "lat: 51.5, lon: -0.1" or direct coordinates
    const latMatch = text.match(/lat[:\s]+(-?\d+\.?\d*)/i);
    const lonMatch = text.match(/lon[:\s]+(-?\d+\.?\d*)/i);

    if (latMatch && lonMatch) {
      return {
        lat: parseFloat(latMatch[1]),
        lon: parseFloat(lonMatch[1])
      };
    }

    // Try data attributes
    if (element.dataset.lat && element.dataset.lon) {
      return {
        lat: parseFloat(element.dataset.lat),
        lon: parseFloat(element.dataset.lon)
      };
    }

    // Try to find in child elements
    const latEl = element.querySelector('[data-lat]');
    const lonEl = element.querySelector('[data-lon]');

    if (latEl && lonEl) {
      return {
        lat: parseFloat(latEl.dataset.lat),
        lon: parseFloat(lonEl.dataset.lon)
      };
    }

    return null;
  }

  // Extract coordinates from map popup
  function extractCoordinatesFromPopup(popup) {
    const text = popup.textContent || popup.innerHTML;

    // Look for various coordinate formats
    // Format: "lat: 51.5074, lon: -0.1278"
    let match = text.match(/lat[:\s]+(-?\d+\.?\d*)[,\s]+lon[:\s]+(-?\d+\.?\d*)/i);
    if (match) {
      return { lat: parseFloat(match[1]), lon: parseFloat(match[2]) };
    }

    // Format: coordinates in parentheses (51.5074, -0.1278)
    match = text.match(/\((-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)\)/);
    if (match) {
      return { lat: parseFloat(match[1]), lon: parseFloat(match[2]) };
    }

    return null;
  }

  // Get coordinates from currently selected result
  function getSelectedResultCoordinates() {
    // Try to find selected/highlighted element
    const selected = document.querySelector('.selected, .highlight, tr.active, .element.active');

    if (selected) {
      return extractCoordinatesFromElement(selected);
    }

    // Try to get from open popup
    const popup = document.querySelector('.leaflet-popup-content');
    if (popup) {
      return extractCoordinatesFromPopup(popup);
    }

    return null;
  }

  // Open the viewer with given coordinates
  function openViewer(coords) {
    if (!coords || !coords.lat || !coords.lon) {
      console.error('Invalid coordinates:', coords);
      return;
    }

    currentCoordinates = coords;

    // Update coordinates display
    const coordsDisplay = viewerModal.querySelector('.overpass-quickview-coordinates');
    coordsDisplay.textContent = `📍 ${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`;

    // Load the current tab
    const activeTab = viewerModal.querySelector('.overpass-quickview-tab.active');
    switchTab(activeTab ? activeTab.dataset.tab : 'maps');

    // Show modal
    viewerModal.classList.remove('overpass-quickview-hidden');
    document.body.style.overflow = 'hidden';
  }

  // Close the viewer
  function closeViewer() {
    viewerModal.classList.add('overpass-quickview-hidden');
    document.body.style.overflow = '';

    // Clear iframe
    const iframe = viewerModal.querySelector('#quickview-frame');
    iframe.src = 'about:blank';
  }

  // Switch between Maps and Street View tabs
  function switchTab(tabName) {
    if (!currentCoordinates) {
      return;
    }

    const { lat, lon } = currentCoordinates;
    const iframe = viewerModal.querySelector('#quickview-frame');

    // Update active tab
    viewerModal.querySelectorAll('.overpass-quickview-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Load appropriate view
    if (tabName === 'maps') {
      // Google Maps embed URL
      iframe.src = `https://www.google.com/maps?q=${lat},${lon}&output=embed&z=15`;
    } else if (tabName === 'streetview') {
      // Google Street View embed URL
      iframe.src = `https://www.google.com/maps/embed/v1/streetview?location=${lat},${lon}&key=YOUR_API_KEY_HERE&heading=0&pitch=0&fov=90`;

      // Note: Street View requires an API key for embedding
      // For now, we'll try the standard embed which may have limitations
      iframe.src = `https://www.google.com/maps/@${lat},${lon},3a,75y,0h,90t/data=!3m7!1e1!3m5!1s0!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fpanoid%3D0%26cb_client%3Dmaps_sv.tactile.gps%26w%3D203%26h%3D100%26yaw%3D0%26pitch%3D0%26thumbfov%3D100!7i13312!8i6656?output=embed`;
    }
  }

  // Start the extension
  init();
})();
