import { defineContentScript } from 'wxt/sandbox';
import { createLogger } from './utils';

/**
 * Base content script class that provides common functionality for site-specific content scripts
 * @template T The type of data that will be extracted by this content script
 */
export function createBaseContentScript<T>(options: {
  siteName: string;
  matches: string[];
  extractDataFunction: () => T;
}) {
  const { siteName, matches, extractDataFunction } = options;
  const siteNameLower = siteName.toLowerCase();
  const logger = createLogger(`Base Content Service`);
  
  return defineContentScript({
    matches,
    main() {
      logger.log(`${siteName} specific content script loaded`);
      
      // Instead of listening for messages directly, register an extractor function
      // that the main content script can call
      window.__PLIFY_EXTRACTORS = window.__PLIFY_EXTRACTORS || {};
      window.__PLIFY_EXTRACTORS[siteNameLower] = extractDataFunction;
      
      // Register this site-specific script with the main content script
      if (window.__PLIFY_SITE_INFO) {
        window.__PLIFY_SITE_INFO.siteSpecificLoaded = true;
        window.__PLIFY_SITE_INFO.extractorAvailable = true;
      }
      
      logger.log(`Registered ${siteName} extractor function`);
    },
  });
}

// Export a type for the message actions to encourage consistency
export type ContentScriptAction = 
  | 'ping'
  | 'getSite'
  | `extract.${string}`
  | `get.${string}`
  | `highlight.${string}`;

// Export a type for the extractor functions
export type ExtractorFunction<T = any> = () => T; 