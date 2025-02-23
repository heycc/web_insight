// Background service worker for Reddit Insight extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Reddit Insight extension installed');
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes('reddit.com')) {
    // Enable and open side panel
    chrome.sidePanel.setOptions({
      enabled: true,
      path: 'pages/sidebar/sidebar.html'
    });
    chrome.sidePanel.open({ windowId: tab.windowId });
  } else {
    console.log('Reddit Insight only works on Reddit pages');
  }
});

// Enable side panel on Reddit pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('reddit.com')) {
    chrome.sidePanel.setOptions({
      enabled: true,
      path: 'pages/sidebar/sidebar.html'
    });
  }
});