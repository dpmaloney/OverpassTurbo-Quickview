// OverpassTurbo-Quickview Content Script
// Injects viewer functionality into Overpass Turbo pages

(function() {
  'use strict';

  let viewerModal = null;
  let currentCoordinates = null;

  // Initialize the extension
  function init() {
    console.log('OverpassTurbo-Quickview: Extension loaded');

    // Wait for page to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setup);
    } else {
      setup();
    }
  }

  function setup() {
    console.log('OverpassTurbo-Quickview: Setting up...');

    // Create the viewer modal
    createViewerModal();

    // Add keyboard shortcuts
    setupKeyboardShortcuts();

    // Monitor for Leaflet map clicks (Overpass Turbo uses Leaflet)
    setupMapMonitoring();

    console.log('OverpassTurbo-Quickview: Ready! Click on map markers or press V with a feature selected.');
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
          <span class="overpass-quickview-hint">Press <kbd>Esc</kbd> to close | <kbd>M</kbd> for Maps | <kbd>S</kbd> for Street View | Click coordinates to copy</span>
        </div>
      </div>
    `;

    document.body.appendChild(viewerModal);
    console.log('OverpassTurbo-Quickview: Modal created');

    // Setup modal event listeners
    viewerModal.querySelector('.overpass-quickview-close').addEventListener('click', closeViewer);
    viewerModal.querySelector('.overpass-quickview-overlay').addEventListener('click', closeViewer);

    // Tab switching
    viewerModal.querySelectorAll('.overpass-quickview-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        switchTab(this.dataset.tab);
      });
    });

    // Click coordinates to copy
    viewerModal.querySelector('.overpass-quickview-coordinates').addEventListener('click', function() {
      if (currentCoordinates) {
        const text = `${currentCoordinates.lat}, ${currentCoordinates.lon}`;
        navigator.clipboard.writeText(text).then(() => {
          console.log('Coordinates copied:', text);
        });
      }
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

      // V to open viewer with clicked location or selected feature
      if (e.key === 'v' || e.key === 'V') {
        console.log('OverpassTurbo-Quickview: V pressed');
        const coords = getCoordinatesFromPage();
        if (coords) {
          console.log('OverpassTurbo-Quickview: Found coordinates:', coords);
          openViewer(coords);
        } else {
          console.log('OverpassTurbo-Quickview: No coordinates found. Try clicking on a map marker first.');
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

    console.log('OverpassTurbo-Quickview: Keyboard shortcuts set up');
  }

  // Monitor for map interactions
  function setupMapMonitoring() {
    // Add a mutation observer to watch for popup changes
    const observer = new MutationObserver(function(mutations) {
      // Check for Leaflet popups
      const popup = document.querySelector('.leaflet-popup-content');
      if (popup && !popup.querySelector('.overpass-quickview-btn')) {
        addViewButtonToPopup(popup);
      }
    });

    // Observe the entire document for popup changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also add click listener to the map
    setTimeout(() => {
      const mapContainer = document.querySelector('#map');
      if (mapContainer) {
        console.log('OverpassTurbo-Quickview: Map container found');

        // Add click listener to capture coordinates
        mapContainer.addEventListener('click', function(e) {
          // Try to get coordinates from Leaflet map
          setTimeout(() => {
            const coords = getCoordinatesFromPage();
            if (coords) {
              console.log('OverpassTurbo-Quickview: Stored coordinates from click:', coords);
            }
          }, 100);
        });
      } else {
        console.log('OverpassTurbo-Quickview: Map container not found yet');
      }
    }, 2000);
  }

  // Add view button to popup
  function addViewButtonToPopup(popup) {
    const coords = extractCoordinatesFromText(popup.textContent);
    if (!coords) return;

    const btn = document.createElement('button');
    btn.className = 'overpass-quickview-btn';
    btn.textContent = '🗺️ View in Maps/Street View';
    btn.style.cssText = 'display: block; width: 100%; margin-top: 8px; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;';

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      console.log('OverpassTurbo-Quickview: Button clicked with coords:', coords);
      openViewer(coords);
    });

    popup.appendChild(btn);
    console.log('OverpassTurbo-Quickview: Added view button to popup');
  }

  // Extract coordinates from various sources on the page
  function getCoordinatesFromPage() {
    // Try to get from open popup first
    const popup = document.querySelector('.leaflet-popup-content');
    if (popup) {
      const coords = extractCoordinatesFromText(popup.textContent);
      if (coords) return coords;
    }

    // Try to get from data viewer (when a feature is selected)
    const dataViewer = document.querySelector('#data-viewer, #dataviewer');
    if (dataViewer) {
      const coords = extractCoordinatesFromText(dataViewer.textContent);
      if (coords) return coords;
    }

    // Try to get from anywhere in the page that has coordinate info
    const allText = document.body.textContent;
    return extractCoordinatesFromText(allText);
  }

  // Extract coordinates from text using multiple patterns
  function extractCoordinatesFromText(text) {
    if (!text) return null;

    // Pattern 1: "lat": 51.5, "lon": -0.1
    let match = text.match(/"lat"[:\s]+(-?\d+\.?\d*)[,\s]+"lon"[:\s]+(-?\d+\.?\d*)/i);
    if (match) {
      return { lat: parseFloat(match[1]), lon: parseFloat(match[2]) };
    }

    // Pattern 2: lat: 51.5, lon: -0.1
    match = text.match(/lat[:\s]+(-?\d+\.?\d*)[,\s]+lon[:\s]+(-?\d+\.?\d*)/i);
    if (match) {
      return { lat: parseFloat(match[1]), lon: parseFloat(match[2]) };
    }

    // Pattern 3: (51.5, -0.1) or [51.5, -0.1]
    match = text.match(/[\(\[]\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*[\)\]]/);
    if (match) {
      const val1 = parseFloat(match[1]);
      const val2 = parseFloat(match[2]);
      // Determine which is lat/lon based on range
      if (Math.abs(val1) <= 90 && Math.abs(val2) <= 180) {
        return { lat: val1, lon: val2 };
      }
    }

    // Pattern 4: Look for center coordinate from Overpass Turbo
    match = text.match(/center[:\s]+(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/i);
    if (match) {
      return { lat: parseFloat(match[1]), lon: parseFloat(match[2]) };
    }

    return null;
  }

  // Open the viewer with given coordinates
  function openViewer(coords) {
    if (!coords || !coords.lat || !coords.lon) {
      console.error('OverpassTurbo-Quickview: Invalid coordinates:', coords);
      return;
    }

    currentCoordinates = coords;
    console.log('OverpassTurbo-Quickview: Opening viewer with:', coords);

    // Update coordinates display
    const coordsDisplay = viewerModal.querySelector('.overpass-quickview-coordinates');
    coordsDisplay.textContent = `📍 ${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`;
    coordsDisplay.style.cursor = 'pointer';
    coordsDisplay.title = 'Click to copy coordinates';

    // Load the current tab
    const activeTab = viewerModal.querySelector('.overpass-quickview-tab.active');
    switchTab(activeTab ? activeTab.dataset.tab : 'maps');

    // Show modal
    viewerModal.classList.remove('overpass-quickview-hidden');
    document.body.style.overflow = 'hidden';
  }

  // Close the viewer
  function closeViewer() {
    console.log('OverpassTurbo-Quickview: Closing viewer');
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

    console.log('OverpassTurbo-Quickview: Switching to', tabName, 'with coords:', lat, lon);

    // Update active tab
    viewerModal.querySelectorAll('.overpass-quickview-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Load appropriate view
    if (tabName === 'maps') {
      // Google Maps standard embed URL (no API key needed)
      iframe.src = `https://maps.google.com/maps?q=${lat},${lon}&t=k&z=18&output=embed`;
    } else if (tabName === 'streetview') {
      // Google Street View using standard maps URL
      iframe.src = `https://maps.google.com/maps?q=&layer=c&cbll=${lat},${lon}&cbp=11,0,0,0,0&output=embed`;
    }
  }

  // Start the extension
  init();
})();
