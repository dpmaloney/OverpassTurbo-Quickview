# CLAUDE.md - AI Assistant Guide for OverpassTurbo-Quickview

## Project Overview

**OverpassTurbo-Quickview** is a Chrome browser extension (Manifest V3) designed to enhance the Overpass Turbo experience by integrating Google Streetview and Google Maps viewing capabilities. The extension makes it easy for users to quickly scan and visualize large numbers of OpenStreetMap query results.

### Project Status
- **Stage**: Early Development
- **Version**: 1.0 (initial)
- **Last Updated**: November 2025

## Technology Stack

- **Platform**: Chrome Extension (Manifest V3)
- **Languages**: JavaScript (vanilla), HTML, CSS
- **Build Tools**: None (currently pure static files)
- **Version Control**: Git

## Repository Structure

```
OverpassTurbo-Quickview/
├── .git/                    # Git repository metadata
├── .gitattributes          # Git attributes configuration
├── README.md               # Project description
├── manifest.json           # Chrome extension manifest (V3)
├── hello.html             # Extension popup HTML
├── popup.js               # Popup script logic
└── CLAUDE.md              # This file - AI assistant guide
```

## File Descriptions

### manifest.json
**Purpose**: Chrome Extension Manifest V3 configuration
- Defines extension metadata (name, description, version)
- Specifies popup UI (hello.html) and icon
- **Key Convention**: Must follow Manifest V3 specifications
- **Line Reference**: manifest.json:1-10

**Current Configuration**:
- Name: "Overpass Turbo Viewer"
- Description: "View Google Streetview/Maps in Overpass Turbo"
- Version: 1.0
- Manifest Version: 3

### hello.html
**Purpose**: Extension popup interface
- Simple HTML structure with script injection
- **Current State**: Minimal scaffold with header and popup.js reference
- **Line Reference**: hello.html:1-6

### popup.js
**Purpose**: Popup behavior and logic
- **Current State**: Basic console.log placeholder
- **Future**: Will contain main extension logic for Overpass Turbo integration
- **Line Reference**: popup.js:1

## Development Workflows

### Local Development

1. **Loading the Extension**:
   ```bash
   # In Chrome/Edge, navigate to chrome://extensions/
   # Enable "Developer mode"
   # Click "Load unpacked"
   # Select the project directory
   ```

2. **Making Changes**:
   - Edit files directly (no build step currently)
   - Click refresh icon in chrome://extensions/ to reload
   - Reopen popup to see changes

3. **Testing**:
   - Test popup functionality manually
   - Check browser console for errors
   - Verify on Overpass Turbo website: https://overpass-turbo.eu/

### Git Workflow

- **Main Branch**: Not specified in current config
- **Feature Branches**: Use `claude/` prefix for AI-generated branches
- **Commit Messages**: Clear, descriptive format
- **Current Commits**:
  - c15eacb: "Intro"
  - 4f1afa6: "Initial commit"

### Adding New Features

When implementing new features:

1. **Check Manifest Requirements**: Ensure new permissions are added to manifest.json
2. **Content Scripts**: If interacting with Overpass Turbo pages, add content_scripts to manifest
3. **Background Scripts**: For persistent logic, add background service worker
4. **Permissions**: Add required permissions (e.g., "activeTab", "storage", "geolocation")
5. **Icons**: Add required icon sizes (16x16, 48x48, 128x128)

## Key Conventions

### Chrome Extension Best Practices

1. **Manifest V3 Compliance**:
   - Use service workers instead of background pages
   - Avoid remotely hosted code
   - Use declarative APIs where possible
   - Follow Chrome Web Store policies

2. **Security**:
   - No inline scripts (use external .js files)
   - Implement Content Security Policy
   - Sanitize user inputs
   - Request minimal permissions

3. **File Organization** (Recommended for Future):
   ```
   ├── assets/
   │   └── icons/          # Extension icons
   ├── src/
   │   ├── popup/          # Popup UI files
   │   ├── content/        # Content scripts
   │   ├── background/     # Background service worker
   │   └── lib/            # Shared utilities
   ├── styles/             # CSS files
   └── manifest.json       # Root manifest
   ```

### Code Style

- **JavaScript**: Use modern ES6+ syntax
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Comments**: Document complex logic and API integrations
- **Error Handling**: Always use try-catch for async operations

## Integration Points

### Overpass Turbo Integration

**Target Website**: https://overpass-turbo.eu/

**Expected Integration**:
- Detect Overpass Turbo query results
- Extract coordinates from results
- Provide quick-view buttons for Google Maps/Streetview
- Handle multiple result items efficiently

**Required APIs**:
- Google Maps JavaScript API (may need API key)
- Google Street View API
- Overpass API (read-only access)

## Future Development Considerations

### Immediate Needs

1. **Icon Assets**: Missing icon file referenced in manifest (hello_extensions.png)
2. **Content Script**: To interact with Overpass Turbo web pages
3. **Permissions**: Add necessary permissions for:
   - Active tab access
   - Storage (for user preferences)
   - Optional: Geolocation

### Feature Roadmap Suggestions

1. **Phase 1 - Core Functionality**:
   - Detect Overpass Turbo results
   - Add quick-view buttons to results
   - Open Google Maps/Streetview in new tabs

2. **Phase 2 - Enhanced UX**:
   - In-popup map preview
   - Keyboard shortcuts
   - Result filtering

3. **Phase 3 - Advanced Features**:
   - Batch viewing mode
   - Custom map layers
   - Export coordinates
   - User preferences

### Dependencies to Consider

- **Google Maps API**: Will need API key configuration
- **Build Tools**: Consider adding webpack/rollup for:
  - Code bundling
  - CSS preprocessing
  - Environment variable management
  - Minification for production

## Testing Guidelines

### Manual Testing Checklist

- [ ] Extension loads without errors
- [ ] Popup opens correctly
- [ ] Content script injects properly on Overpass Turbo
- [ ] Google Maps/Streetview links work
- [ ] Handles edge cases (no results, invalid coordinates)
- [ ] Works across different Chrome versions

### Browser Compatibility

- **Primary**: Chrome (latest)
- **Secondary**: Microsoft Edge (Chromium-based)
- **Future**: Firefox (requires manifest.json adaptation)

## Common Tasks for AI Assistants

### When Adding Content Scripts

```json
// Add to manifest.json
"content_scripts": [
  {
    "matches": ["https://overpass-turbo.eu/*"],
    "js": ["content.js"],
    "run_at": "document_end"
  }
]
```

### When Adding Permissions

```json
// Add to manifest.json
"permissions": [
  "activeTab",
  "storage"
],
"host_permissions": [
  "https://overpass-turbo.eu/*"
]
```

### When Adding Background Service Worker

```json
// Add to manifest.json
"background": {
  "service_worker": "background.js"
}
```

## Debugging Tips

1. **Popup Issues**: Right-click popup → Inspect to open DevTools
2. **Content Script Issues**: Open page DevTools, check console
3. **Background Script**: Go to chrome://extensions/ → Details → Inspect views: background
4. **Manifest Errors**: Check chrome://extensions/ for error badges

## Environment Variables

Currently none. Consider adding for future:
- Google Maps API key
- Development/production modes
- Feature flags

## API Keys and Secrets

⚠️ **Important**: Never commit API keys to the repository
- Use environment variables or config files
- Add sensitive files to .gitignore
- Consider using Chrome's storage API for user-provided keys

## Resources

### Official Documentation
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)

### Related Projects
- Overpass Turbo: https://github.com/tyrasd/overpass-turbo

## Notes for AI Assistants

1. **Always check manifest.json** before adding features requiring new permissions
2. **Preserve Manifest V3 compliance** - no deprecated APIs
3. **Test changes locally** before committing
4. **Document new features** in both code comments and README.md
5. **Consider user privacy** - minimize data collection
6. **Follow Chrome Web Store policies** for future publication
7. **Keep dependencies minimal** - prefer vanilla JS when possible
8. **Optimize for performance** - extension should not slow down browser

## Recent Changes

- **2025-11-15**: Initial CLAUDE.md creation
- **2025-11-15**: Project initialization with basic manifest and popup

---

*This document should be updated whenever significant architectural changes or new conventions are introduced to the codebase.*
