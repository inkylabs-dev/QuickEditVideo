# Testing Guide

This document describes the end-to-end testing setup for QuickEditVideo.

## Overview

The project uses Playwright for end-to-end testing to ensure the application works correctly across different browsers and scenarios.

## Test Structure

### Test Files
- `tests/e2e/home.spec.js` - Tests for the homepage functionality
- `tests/e2e/trim.spec.js` - Tests for the video trimmer page

### Home Page Tests
1. **Page Loading** - Verifies homepage loads with correct title and content
2. **Navigation** - Ensures navigation elements are present
3. **Start Editing Button** - Tests the primary CTA redirects to /trim page
4. **Hero Section** - Validates hero content and description text
5. **Mobile Responsiveness** - Tests mobile viewport functionality

### Trim Page Tests
1. **Page Loading** - Verifies trim page loads with correct title
2. **Page Header** - Tests header content and structure
3. **Navigation** - Ensures navigation works properly
4. **Video Trimmer Component** - Validates main component presence
5. **Mobile Responsiveness** - Tests mobile viewport functionality
6. **Styling** - Verifies CSS classes and layout
7. **Navigation Back** - Tests returning to home page

## Running Tests

### Prerequisites
```bash
npm install
npm run build
```

### Run All Tests
```bash
npm run test:e2e
```

### Run with UI
```bash
npm run test:e2e:ui
```

### Run Specific Test File
```bash
npx playwright test tests/e2e/home.spec.js
```

### Run Single Browser
```bash
npx playwright test --project=chromium
```

## CI/CD Integration

The tests are automatically run in the GitHub Actions workflow:
- On push to main/develop branches
- On pull requests to main branch
- Tests run against Chromium, Firefox, and WebKit
- Test results are uploaded as artifacts

## Configuration

The Playwright configuration is in `playwright.config.js`:
- Tests run against `http://localhost:4321`
- Uses `npm run preview` as the web server
- Configured for CI/CD environments
- Cross-browser testing enabled

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Stop any running dev/preview servers
   - Or set `reuseExistingServer: true` in playwright.config.js

2. **Browser Installation**
   - Run `npx playwright install` to install browsers
   - In CI, browsers are installed automatically

3. **Test Timeouts**
   - Default timeout is 30 seconds
   - Can be adjusted in the configuration

### Local Development
When developing tests locally:
1. Build the application: `npm run build`
2. Run tests: `npm run test:e2e`
3. Use `--ui` flag for interactive debugging

The tests will automatically start a preview server and run against the built application.