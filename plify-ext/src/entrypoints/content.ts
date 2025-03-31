import { defineContentScript } from 'wxt/sandbox';
import { ContentScriptAction, ExtractorFunction } from '../lib/base-content-script';
import { createLogger } from '../lib/utils';

/**
 * Main content script that detects the current site and coordinates with site-specific content scripts
 */
export default defineContentScript({
  matches: [
    '*://*.reddit.com/*',
    '*://*.youtube.com/*'
  ],
  main() {
    const logger = createLogger('Base Content');
    logger.log('Main content script loaded');
    
    // Detect the current site
    const url = window.location.href;
    let siteName = 'Unknown';
    let siteNameLowercase = 'unknown';
    
    if (url.includes('reddit.com')) {
      siteName = 'Reddit';
      siteNameLowercase = 'reddit';
    } else if (url.includes('youtube.com')) {
      siteName = 'YouTube';
      siteNameLowercase = 'youtube';
    }

    // Register site information in the window object
    window.__PLIFY_SITE_INFO = {
      siteName: siteName,
      siteNameLower: siteNameLowercase,
      url: url,
      loadTime: new Date().toISOString(),
      siteSpecificLoaded: false,
      extractorAvailable: false
    };
    
    // Initialize the extractors object if it doesn't exist
    window.__PLIFY_EXTRACTORS = window.__PLIFY_EXTRACTORS || {};
    
    logger.log('Registered site info in window object');
    
    // Listen for all messages and coordinate with site-specific scripts
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      // logger.log('Main content script received message:', request);
      
      try {
        const action = request.action as ContentScriptAction;
        
        // Handle ping to check if content script is loaded
        if (action === 'ping') {
          sendResponse({ 
            success: true,
            site: siteName,
            siteInfo: window.__PLIFY_SITE_INFO,
            // Include information about whether site-specific script is loaded
            siteSpecificLoaded: window.__PLIFY_SITE_INFO?.siteSpecificLoaded || false,
            extractorAvailable: window.__PLIFY_SITE_INFO?.extractorAvailable || false
          });
          return true; // Keep channel open for async response
        }
        
        // Handle request to get the current site
        if (action === 'getSite') {
          sendResponse({
            success: true,
            site: siteName,
            siteInfo: window.__PLIFY_SITE_INFO
          });
          return true; // Keep channel open for async response
        }
        
        // Handle site-specific data extraction requests
        const normalizedAction = action.toLowerCase();
        if (normalizedAction.startsWith('extract.') || normalizedAction.startsWith('get.')) {
          // Extract the site name from the action
          const parts = normalizedAction.split('.');
          if (parts.length !== 2) {
            sendResponse({
              success: false,
              error: `Invalid action format: ${action}`,
              site: siteName
            });
            return true;
          }
          
          const targetSite = parts[1];
          
          // Check if we have an extractor for this site
          // Ensure extractors object exists
          const extractors = window.__PLIFY_EXTRACTORS || {};
          
          if (!extractors[targetSite]) {
            sendResponse({
              success: false,
              error: `No extractor available for site: ${targetSite}`,
              site: siteName
            });
            return true;
          }
          
          // Call the extractor function
          try {
            // logger.log(`Calling extractor for ${targetSite}`);
            const data = extractors[targetSite]();
            sendResponse({
              success: true,
              data: data,
              source: siteName
            });
          } catch (extractError) {
            logger.error(`Error extracting data:`, extractError instanceof Error ? extractError.message : String(extractError));
            sendResponse({
              success: false,
              error: extractError instanceof Error ? extractError.message : String(extractError),
              source: siteName
            });
          }
          return true; // Keep channel open for async response
        }
        
        // For any other actions, we don't handle them
        logger.log(`Unknown action: ${action}`);
        sendResponse({
          success: false,
          error: `Unknown action: ${action}`,
          site: siteName
        });
        return true; // We've handled the response
      } catch (error: unknown) {
        logger.error('Error:', error instanceof Error ? error.message : String(error));
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          site: siteName
        });
        return true; // Error already sent, keep channel open for async response
      }
    });
  }
});

// Add type definitions for window object
declare global {
  interface Window {
    __PLIFY_SITE_INFO?: {
      siteName: string;
      siteNameLower: string;
      url: string;
      loadTime: string;
      siteSpecificLoaded?: boolean;
      extractorAvailable?: boolean;
    };
    __PLIFY_EXTRACTORS?: {
      [siteName: string]: ExtractorFunction;
    };
  }
}
