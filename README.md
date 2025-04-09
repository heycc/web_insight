# Reddit Insight

A Chrome extension that provides AI-powered summaries of Reddit posts and comments to help you quickly understand discussions.

## Functionality

Reddit Insight extracts and analyzes content from Reddit pages to provide concise summaries of lengthy discussions. The extension uses AI to identify key points, popular opinions, and important information without requiring you to read through hundreds of comments.

## Features

- **Data Extraction**: Automatically extracts post content and comments from any Reddit page
- **AI Summarization**: Condenses lengthy discussions into concise, readable summaries
- **Multiple AI Providers**: Support for various AI services including OpenAI, Anthropic, and others
- **Customizable**: Configure different summary formats and language styles
- **Real-time Processing**: Streams AI responses as they're generated
- **Privacy-focused**: Processes data locally and only sends information to the AI provider you configure

## Development Setup

1. Clone the repository:
   ```
   git clone https://github.com/heycc/web_insight.git
   cd web_insight/plify-ext/
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top-right corner
   - Click "Load unpacked" and select the `dist` directory from your project
   - The extension should now appear in your browser's toolbar

## Building for Production

To create a production-ready version of the extension:

```
npm run build
```

The optimized extension will be available in the `dist` directory.

## Loading in Developer Mode

During development, any changes you make will automatically rebuild the extension. To see your changes:

1. Make your code changes
2. If not running already, start the development server with `npm run dev`
3. In Chrome extensions page (`chrome://extensions/`), click the refresh icon on the Reddit Insight card
4. Reload any Reddit pages where you're testing the extension

## Project Structure

The project uses WXT (Web Extension Tools) for development and follows this structure:

```
plify-ext/
├── src/                    # Source code
│   ├── components/         # UI components
│   │   ├── sidepanel/      # Sidepanel-specific components
│   │   ├── settings/       # Settings page components
│   │   └── ui/             # Shared UI components
│   ├── lib/                # Core functionality and services
│   │   ├── summary.ts      # AI summarization service
│   │   ├── reddit-service.ts  # Reddit data extraction
│   │   ├── youtube-service.ts # YouTube data extraction
│   │   ├── content-service.ts # Content extraction base service
│   │   ├── base-content-script.ts # Base content script functionality
│   │   └── utils.ts        # Utility functions
│   ├── entrypoints/        # Extension entry points
│   │   ├── background.ts   # Background service worker
│   │   ├── content.ts      # Main content script
│   │   ├── reddit-content.ts # Reddit-specific content script
│   │   ├── youtube-content.ts # YouTube-specific content script
│   │   ├── sidepanel/      # Sidepanel UI entry point
│   │   └── settings/       # Settings page entry point
│   ├── assets/             # SVG icons and other assets
│   ├── public/             # Static public assets
│   ├── globals.css         # Global CSS styles
│   └── index.css           # CSS entry point
├── dist/                   # Built extension files
├── wxt.config.ts           # WXT configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── package.json            # Project dependencies and scripts
```

## Summarization Feature

The summarization feature uses the SummaryService to generate AI-powered summaries of Reddit posts and comments. The service:

1. Gets the first profile from the user's settings
2. Formats the Reddit data into a prompt for the AI
3. Streams the AI response back to the UI in real-time

The summary is displayed in a structured format that includes:
- The main point of the post
- Key opinions from comments, grouped by similarity
- Quoted highlights from original comments
- Overall sentiment or conclusion

## Configuration

Users can configure multiple AI provider profiles in the settings page. Each profile includes:
- Provider type (OpenAI, Anthropic, etc.)
- API endpoint
- API key
- Model name

The extension always uses the first profile for summarization.
