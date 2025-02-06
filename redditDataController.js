export class RedditDataController {
  static async fetchPageData(tabId) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { action: 'getRedditData' }, response => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        if (!response || !response.data) {
          reject(new Error('Invalid response from page'));
          return;
        }
        resolve(response.data);
      });
    });
  }
}