import { defineContentScript } from 'wxt/sandbox';
import { ContentData } from './content-service';

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
  
  return defineContentScript({
    matches,
    main() {
      console.log(`[Base Content] Base content script loaded`);
      
      // Listen for messages from popup or background
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        try {
          // Handle ping to check if content script is loaded
          if (request.action === 'ping') {
            console.log(`[Base Content] Handling ping request`);
            sendResponse({ 
              success: true,
              site: siteName,
              source: 'site-specific'
            });
            return true; // Keep channel open for async response
          }
          
          // Handle data extraction request with consistent naming convention
          // Support both old and new naming conventions for backward compatibility
          const normalizedAction = request.action.toLowerCase();
          const expectedActions = [
            // New consistent naming convention
            `extract.${siteNameLower}`,
            `get.${siteNameLower}`,
          ];

          if (expectedActions.includes(normalizedAction)) {
            console.log(`[Base Content] Handling data extraction request: ${normalizedAction}`);
            try {
              const data = extractDataFunction();
              
              sendResponse({
                success: true,
                data: data,
                source: siteName
              });
              console.log(`[Base Content] Data extraction response sent for ${normalizedAction}`);
              return true; // Keep channel open for async response
            } catch (extractError) {
              console.error(`[Base Content] Error extracting data:`, extractError);
              sendResponse({
                success: false,
                error: extractError instanceof Error ? extractError.message : String(extractError),
                source: siteName
              });
              return true;
            }
          }
          
          // If we reach here, we didn't handle the action
          console.warn(`[Base Content] Unknown action:`, request.action);
          sendResponse({ 
            success: false, 
            error: `Unknown action: ${request.action}`,
            source: siteName
          });
          return true; // Keep channel open for async response
        } catch (error: unknown) {
          console.error(`[Base Content] Error:`, error instanceof Error ? error.message : String(error));
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            source: siteName
          });
          return true; // Keep channel open for async response
        }
      });
    },
  });
} 