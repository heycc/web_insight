import { defineBackground } from 'wxt/sandbox';

export default defineBackground(() => {
  console.log('Background script loaded', { id: chrome.runtime.id });

  // Set the sidepanel to open when the action button is clicked
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  // Listen for browser action clicks (as a fallback)
  chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
      // Open the sidepanel for the current tab
      chrome.sidePanel.open({ tabId: tab.id });
    }
  });

  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openSidebar') {
      // Open the sidebar
      chrome.sidePanel.open({ tabId: chrome.tabs.TAB_ID_NONE });
      sendResponse({ success: true });
    }
    
    // We no longer need to handle extractRedditData or extractYouTubeData here as the sidepanel
    // will communicate directly with the content script
    
    return true; // Keep message channel open for async response
  });
});
