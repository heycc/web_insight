# Reddit Data Extractor and Summarizer

A Chrome extension that extracts and summarizes Reddit posts and comments.

## Features

- Extract Reddit post and comment data from any Reddit page
- Summarize the extracted data using AI
- Configure different AI providers (OpenAI, Anthropic, etc.)
- Customize the summary format and language

## Project Structure

The project follows a modular architecture to ensure maintainability:

```
src/
├── components/       # Reusable UI components
├── lib/              # Core functionality and services
│   ├── summary.ts    # SummaryService for AI-powered summarization
│   └── reddit-service.ts # Service for handling Reddit data extraction and summarization
├── entrypoints/      # Extension entry points
│   ├── background.ts # Background script
│   ├── content.ts    # Content script for Reddit page interaction
│   ├── sidepanel/    # Sidepanel UI
│   │   └── App.tsx   # Main sidepanel component with Extract and Summarize functionality
│   └── settings/     # Settings page
│       └── App.tsx   # Settings management for AI providers and profiles
└── assets/           # Static assets
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

## Development

To set up the development environment:

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start the development server
4. Load the extension in Chrome from the `dist` directory

## Building for Production

Run `npm run build` to create a production build of the extension.
