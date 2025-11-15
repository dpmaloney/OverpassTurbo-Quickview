# Icon Generation Instructions

## Quick Start

To generate the extension icons:

1. **Open `generate-icons.html` in your web browser**
   - Double-click the file, or
   - Right-click → Open with → Your browser

2. **Click "Download All Icons"** (or download each size individually)

3. **Save the downloaded files** in this directory:
   - `icon16.png` - Small icon for browser toolbar
   - `icon48.png` - Medium icon for extension management
   - `icon128.png` - Large icon for Chrome Web Store

4. **Reload your extension** in `chrome://extensions/`

That's it! The manifest.json is already configured to use these icons.

## Icon Design

The icon features:
- **Blue circular background** - Represents the Overpass Turbo brand
- **Green map pin** - Indicates location-based functionality
- **Eye symbol** - Represents the "quick view" feature

The design is simple and recognizable at all sizes.

## Manual Icon Creation

If you prefer to create custom icons, you can:
1. Edit `icon.svg` with your preferred design
2. Use the SVG file with the HTML generator, or
3. Convert the SVG to PNG manually using tools like:
   - Inkscape
   - GIMP
   - Online SVG to PNG converters

Required sizes: 16x16, 48x48, and 128x128 pixels.
