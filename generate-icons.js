#!/usr/bin/env node

/**
 * Generate PNG icons from the HTML canvas renderer
 * Uses Playwright to automate the icon generation process
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  console.log('🎨 Generating extension icons...');

  // Launch browser
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Load the icon generator HTML file
  const htmlPath = path.join(__dirname, 'generate-icons.html');
  await page.goto(`file://${htmlPath}`);

  // Wait for canvases to render
  await page.waitForTimeout(1000);

  // Generate each icon size
  const sizes = [16, 48, 128];

  for (const size of sizes) {
    console.log(`  Creating icon${size}.png...`);

    // Get the canvas element
    const canvas = await page.$(`#canvas${size}`);

    if (!canvas) {
      console.error(`  ❌ Canvas ${size} not found`);
      continue;
    }

    // Take a screenshot of just the canvas
    const screenshot = await canvas.screenshot();

    // Save to file
    const outputPath = path.join(__dirname, `icon${size}.png`);
    fs.writeFileSync(outputPath, screenshot);

    console.log(`  ✅ icon${size}.png created`);
  }

  await browser.close();

  console.log('\n✨ All icons generated successfully!');
  console.log('📁 Files created: icon16.png, icon48.png, icon128.png');
}

generateIcons().catch(error => {
  console.error('❌ Error generating icons:', error);
  process.exit(1);
});
