// Initialize sidebar
function initSidebar() {
  // Set initial state
  document.getElementById('post-title').textContent = 'Reddit Insight';
  document.getElementById('post-content').textContent = 'Click refresh to load content';
  document.getElementById('post-author').textContent = '';
  document.getElementById('post-score').textContent = '';
  document.getElementById('comments-list').innerHTML = '';

  // Listen for tab updates to enable refresh button
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('reddit.com')) {
      document.getElementById('refresh-btn').disabled = false;
    }
  });
}

// Update sidebar with new data
function updateSidebarData(tabId) {
  chrome.tabs.sendMessage(tabId, {action: 'getRedditData'}, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error communicating with content script:', chrome.runtime.lastError);
      document.getElementById('post-title').textContent = 'Error loading data';
      document.getElementById('post-content').textContent = 'Please refresh the page and try again.';
      return;
    }

    if (!response) {
      console.error('No response received from content script');
      document.getElementById('post-title').textContent = 'Error loading data';
      document.getElementById('post-content').textContent = 'Please refresh the page and try again.';
      return;
    }
    
    // Update post data
    if (!response.data) {
      throw new Error('Invalid response structure from content script');
    }
    document.getElementById('post-title').textContent = response.data.title || 'Untitled Post';
    document.getElementById('post-content').innerHTML = (response.data.content || '').replace(/\n/g, '<br>');
    document.getElementById('post-author').textContent = `by ${response.data.author || 'Unknown'}`;
    document.getElementById('post-score').textContent = `${response.data.score || 0} points`;

    // Update post URL with current tab URL
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs.length > 0) {
      if (tabs[0].url.includes('reddit.com')) {
        const urlElement = document.getElementById('post-url');
        urlElement.href = tabs[0].url;
        urlElement.textContent = tabs[0].url;
        document.getElementById('refresh-btn').disabled = false;
      } else {
        document.getElementById('post-title').textContent = 'Unsupported Page';
        document.getElementById('post-content').textContent = 'This extension only works on Reddit pages.';
        document.getElementById('post-author').textContent = '';
        document.getElementById('post-score').textContent = '';
        document.getElementById('comments-list').innerHTML = '';
        document.getElementById('refresh-btn').disabled = true;
      }
      }
    });

    // Update comments
    const commentsList = document.getElementById('comments-list');
    commentsList.innerHTML = ''; // Clear existing comments
    (response.data.comments || []).forEach(comment => {
      const commentDiv = document.createElement('div');
      commentDiv.className = 'comment';
      commentDiv.innerHTML = `
      <div class="author">${comment.author || 'Deleted'}</div>
      <div class="content">${(comment.content || '').replace(/\n/g, '<br>')}</div>
      <div class="score">${comment.score || 0} points</div>
      `;
      commentsList.appendChild(commentDiv);
    });
  });
}

// Add refresh button click handler
document.getElementById('refresh-btn').addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs.length > 0 && tabs[0].url.includes('reddit.com')) {
      updateSidebarData(tabs[0].id);
    }
  });
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initSidebar);