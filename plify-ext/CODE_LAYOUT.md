# Plify Extension Architecture

## Overview

This Chrome extension is designed to extract and process content from multiple websites (Reddit, YouTube, HackerNews). The codebase follows a modular architecture to promote maintainability, scalability, and separation of concerns.

## Directory Structure

```
src/
├── entrypoints/          # Scripts that run in specific contexts
│   ├── content.ts        # Main content script (runs on all supported sites)
│   ├── reddit-content.ts # Reddit-specific content script
│   ├── background.ts     # Extension background script
│   └── ... other site-specific content scripts
├── lib/                  # Core utilities and services
│   ├── base-content-script.ts    # Factory for content scripts
│   ├── base-site-service.ts      # Abstract base for site services
│   ├── content-service.ts        # Content service interfaces and factory
│   ├── reddit-service.ts         # Reddit-specific service
│   └── ... other site-specific services
```

## Key Components

1. **Content Scripts** (`entrypoints/`): Run in the context of web pages
   - `content.ts`: Router/coordinator for all sites
   - `*-content.ts`: Site-specific DOM interaction

2. **Service Layer** (`lib/`): Run in extension context (background/popup/sidepanel)
   - `base-site-service.ts`: Shared logic for all site services
   - `*-service.ts`: Site-specific implementations
   - `content-service.ts`: Common interfaces and factory

## Communication Flow

1. User interacts with extension UI
2. Service layer (`RedditService`, etc.) sends message to content scripts
3. Main content script (`content.ts`) routes message to site-specific handler
4. Site-specific content script extracts/processes page data
5. Data flows back to service layer for processing

## Benefits of This Architecture

- **Separation of Concerns**: DOM interaction vs. business logic
- **Scalability**: Easy to add support for new websites
- **Maintainability**: Changes to one site don't affect others
- **Consistency**: Common patterns shared across site implementations
- **Testability**: Isolated components are easier to test

This modular approach may seem complex initially but provides significant advantages for a multi-site extension that needs to handle different DOM structures and page behaviors. 