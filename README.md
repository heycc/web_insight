# Reddit Insight Chrome Extension

A Chrome extension that analyzes and displays Reddit post and comment data.

## Features
- Extracts post title, content, author, and score
- Extracts comments with author, content, and score
- Displays data in a persistent sidebar
- Automatically updates when navigating Reddit pages
- Works on all Reddit pages

## Installation
1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Usage
1. Navigate to any Reddit post
2. Click the puzzle piece icon in Chrome's toolbar
3. Select Reddit Insight to open the side panel
4. View and interact with post and comment data
5. The side panel will automatically update as you browse Reddit

## Development
- `manifest.json`: Extension configuration
- `content.js`: Content script for data extraction
- `popup.html`: Popup UI structure
- `popup.js`: Popup logic and data handling
- `popup.css`: Popup styling
- `background.js`: Background service worker

## License
MIT