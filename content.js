// OverpassTurbo-Quickview Content Script
// Injects viewer functionality into Overpass Turbo pages

(function() {
  'use strict';

  let viewerModal = null;
  let currentCoordinates = null;
  let lastClickedCoordinates = null; // Store coordinates from the last clicked feature

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

      // V to open viewer with clicked location
      if (e.key === 'v' || e.key === 'V') {
        console.log('OverpassTurbo-Quickview: V pressed');
        if (lastClickedCoordinates) {
          console.log('OverpassTurbo-Quickview: Using last clicked coordinates:', lastClickedCoordinates);
          openViewer(lastClickedCoordinates);
        } else {
          console.log('OverpassTurbo-Quickview: No coordinates stored. Try clicking on a map marker first.');
          // Try to get from currently open popup as fallback
          const popup = document.querySelector('.leaflet-popup-content');
          if (popup) {
            const coords = extractCoordinatesFromText(popup.textContent);
            if (coords) {
              console.log('OverpassTurbo-Quickview: Found coordinates from open popup:', coords);
              openViewer(coords);
            }
          }
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
      // Look for Leaflet popups
      const popups = document.querySelectorAll('.leaflet-popup-content');

      popups.forEach(popup => {
        // Check if this popup already has our button
        if (popup.querySelector('.overpass-quickview-btn')) {
          return;
        }

        // Extract coordinates from the popup
        const coords = extractCoordinatesFromPopup(popup);
        if (coords) {
          console.log('OverpassTurbo-Quickview: Found popup with coordinates:', coords);

          // Store these as the last clicked coordinates
          lastClickedCoordinates = coords;

          // Add the view button
          addViewButtonToPopup(popup, coords);
        }
      });
    });

    // Observe the entire document for popup changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('OverpassTurbo-Quickview: Monitoring for popups');
  }

  // Extract coordinates specifically from a popup element
  function extractCoordinatesFromPopup(popup) {
    if (!popup) return null;

    // Get all the text and HTML content
    const textContent = popup.textContent || '';
    const htmlContent = popup.innerHTML || '';

    console.log('OverpassTurbo-Quickview: Popup content:', textContent.substring(0, 200));

    // Try various patterns
    const coords = extractCoordinatesFromText(textContent);
    if (coords) {
      return coords;
    }

    // Also try to find in HTML (sometimes coordinates are in attributes)
    const coordsFromHtml = extractCoordinatesFromText(htmlContent);
    return coordsFromHtml;
  }

  // Add view button to popup
  function addViewButtonToPopup(popup, coords) {
    if (!coords) return;

    // Create a separator
    const separator = document.createElement('hr');
    separator.style.cssText = 'margin: 8px 0; border: none; border-top: 1px solid #ddd;';

    const btn = document.createElement('button');
    btn.className = 'overpass-quickview-btn';
    btn.textContent = '🗺️ View in Maps/Street View';
    btn.style.cssText = 'display: block; width: 100%; margin-top: 4px; padding: 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 600; transition: background 0.2s;';

    btn.addEventListener('mouseover', function() {
      this.style.background = '#218838';
    });

    btn.addEventListener('mouseout', function() {
      this.style.background = '#28a745';
    });

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      console.log('OverpassTurbo-Quickview: Button clicked with coords:', coords);
      openViewer(coords);
    });

    popup.appendChild(separator);
    popup.appendChild(btn);
    console.log('OverpassTurbo-Quickview: Added view button to popup');
  }

  // Extract coordinates from text using multiple patterns
  function extractCoordinatesFromText(text) {
    if (!text) return null;

    // Pattern 1: "lat": 51.5, "lon": -0.1 (JSON format)
    let match = text.match(/"lat"[:\s]+(-?\d+\.?\d*)[,\s]+"lon"[:\s]+(-?\d+\.?\d*)/i);
    if (match) {
      return { lat: parseFloat(match[1]), lon: parseFloat(match[2]) };
    }

    // Pattern 2: lat: 51.5, lon: -0.1
    match = text.match(/lat[:\s]+(-?\d+\.?\d*)[,\s]+lon[:\s]+(-?\d+\.?\d*)/i);
    if (match) {
      return { lat: parseFloat(match[1]), lon: parseFloat(match[2]) };
    }

    // Pattern 3: Just the decimal numbers in parentheses or brackets
    // This pattern looks for two decimal numbers that could be coordinates
    const decimals = text.match(/(-?\d+\.\d{4,})/g);
    if (decimals && decimals.length >= 2) {
      const lat = parseFloat(decimals[0]);
      const lon = parseFloat(decimals[1]);
      // Validate ranges
      if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
        return { lat, lon };
      }
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
    lastClickedCoordinates = coords; // Update the last clicked
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
    const apiKey = 'AIzaSyCamo8uLOLtnbAGAG9-j6yf0fyjJq0m71M';

    if (tabName === 'maps') {
      // Google Maps Embed API - satellite view
      iframe.src = `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${lat},${lon}&zoom=19&maptype=satellite`;
    } else if (tabName === 'streetview') {
      // Google Street View Embed API
      iframe.src = `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${lat},${lon}&heading=210&pitch=10&fov=90`;
    }
  }

  // Start the extension
  init();
})();
