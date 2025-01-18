document.addEventListener('DOMContentLoaded', () => {
  // Get current tab and send message to content script
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'getRedditData'}, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      
      // Update post data
      document.getElementById('post-title').textContent = response.title;
      document.getElementById('post-content').textContent = response.content;
      document.getElementById('post-author').textContent = `by ${response.author}`;
      document.getElementById('post-score').textContent = `${response.score} points`;

      // Update comments
      const commentsList = document.getElementById('comments-list');
      response.comments.forEach(comment => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment';
        commentDiv.innerHTML = `
          <div class="author">${comment.author}</div>
          <div class="content">${comment.content}</div>
          <div class="score">${comment.score} points</div>
        `;
        commentsList.appendChild(commentDiv);
      });
    });
  });
});