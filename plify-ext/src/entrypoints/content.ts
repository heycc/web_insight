import { defineContentScript } from 'wxt/sandbox';
// import { SiteDetector } from '../lib/content-service';

/**
 * Main content script that detects the current site and coordinates with site-specific content scripts
 */
export default defineContentScript({
  matches: [
    '*://*.reddit.com/*',
    '*://*.youtube.com/*'
  ],
  main() {
    console.log('[Plify Insight] Main content script loaded');
    
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

    // This code snippet is registering site information in the browser's global window object to share data between different parts of the browser extension.
    // Register that we're loaded to ensure site-specific scripts know the site type
    window.__PLIFY_SITE_INFO = {
      siteName: siteName,
      siteNameLower: siteNameLowercase,
      url: url,
      loadTime: new Date().toISOString()
    };
    
    console.log('[Plify Insight] Registered site info in window object');
    
    // Listen for general messages that aren't site-specific
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('[Plify Insight] Main content script received message:', request);
      
      try {
        // Handle ping to check if content script is loaded
        if (request.action === 'ping') {
          sendResponse({ 
            success: true,
            site: siteName,
            siteInfo: window.__PLIFY_SITE_INFO
          });
          return true; // Keep channel open for async response
        }
        
        // Handle request to get the current site
        if (request.action === 'getSite') {
          sendResponse({
            success: true,
            site: siteName,
            siteInfo: window.__PLIFY_SITE_INFO
          });
          return false; // No need to keep channel open. Why? 
        }
        
        // If the request is specific to this site, try forwarding it explicitly
        const isThisSiteRequest = 
          request.action.toLowerCase().includes(siteNameLowercase) || 
          request.action.toLowerCase().includes(`${siteNameLowercase}data`) ||
          request.action.toLowerCase() === `extract.${siteNameLowercase}` ||
          request.action.toLowerCase() === `get.${siteNameLowercase}`;
          
        if (isThisSiteRequest) {
          // We'll let the site-specific content script handle this
          // but log it for debugging
          console.log(`[Plify Insight] Not handling action: ${request.action}, letting site-specific script handle it`);
          return false; // Don't keep channel open, let the site-specific script handle it
        }
        
        // For any other actions, let the site-specific scripts handle them
        console.log(`[Plify Insight] Not handling action: ${request.action}, letting site-specific script handle it`);
        return false; // Don't keep channel open, let the site-specific script handle it
      } catch (error: unknown) {
        console.error('[Plify Insight] Error:', error instanceof Error ? error.message : String(error));
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        return false; // Error already sent, no need to keep channel open
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
    };
  }
}
