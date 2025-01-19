// Extract Reddit post and comment data
function extractRedditData() {
  const post = {
    title: document.querySelector('h1')?.innerText,
    content: Array.from(document.querySelectorAll('[slot="text-body"] p'))
      .map(p => p.innerText)
      .join('\n\n'),
    author: document.querySelector('[slot="authorName"]')?.innerText,
    score: document.querySelector('[data-test-id="post-score"]')?.getAttribute('aria-label') || document.querySelector('[data-test-id="post-score"]')?.innerText,
    comments: []
  };

  // Extract comments
  const commentElements = document.querySelectorAll('shreddit-comment');
  commentElements.forEach(comment => {
    const author = comment.getAttribute('author');
    // Skip AutoModerator comments
    if (author !== "AutoModerator") {
      const commentContent = comment.querySelector('[slot="comment"]')?.innerText;
      post.comments.push({
        author: author,
        content: commentContent
      });
    }
  });

  return post;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getRedditData') {
    const data = extractRedditData();
    sendResponse(data);
  }
  return true; // Return true to indicate that the message was received
});