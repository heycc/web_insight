// Extract Reddit post and comment data
function extractRedditData() {
  const postElement = document.querySelector('shreddit-post');
  const post = {
    title: postElement?.getAttribute('post-title').innerText,
    content: Array.from(postElement?.querySelectorAll('[slot="text-body"] p') || [])
      .map(p => p.innerText)
      .join('\n\n'),
    author: postElement?.querySelector('author')?.innerText,
    score: postElement?.getAttribute('score'),
    comments: []
  };

  // Extract comments
  const commentElements = document.querySelectorAll('shreddit-comment[depth="0"], shreddit-comment[depth="1"]');
  commentElements.forEach(comment => {
    const author = comment.getAttribute('author');
    // Skip AutoModerator comments
    if (author == "AutoModerator") {
      return;
    }
    const score = comment.getAttribute('score');
    const commentElement = comment.querySelector(':scope > [slot="comment"]');
    const commentContent = Array.from(commentElement.querySelectorAll('p'))
      .map(p => p.innerText)
      .join('\n\n');
    
    post.comments.push({
      author: author,
      content: commentContent,
      score: score ? parseInt(score) : 0
    });
  
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