// Extract Reddit post and comment data
function extractRedditData() {
  const postElement = document.querySelector('shreddit-post');
  let postContent;
  
  const textBody = postElement?.querySelectorAll('[slot="text-body"] p');
  const hasMedia = postElement?.querySelector('[slot="post-media-container"]');
  
  if (textBody && textBody.length > 0) {
    postContent = Array.from(textBody)
      .map(p => p.innerText)
      .join('\n\n');
  } else if (hasMedia) {
    postContent = '<hint: author post a media, no text>';
  } else {
    postContent = '<no content>';
  }
  
  const post = {
    title: postElement?.getAttribute('post-title'),
    content: postContent,
    author: postElement?.getAttribute('author'),
    score: postElement?.getAttribute('score'),
    comments: []
  };

  // Extract comments
  const commentElements = document.querySelectorAll('shreddit-comment[depth="0"], shreddit-comment[depth="1"]');
  commentElements.forEach(comment => {
    try {
      const author = comment.getAttribute('author');
      const score = comment.getAttribute('score');
      const commentElement = comment.querySelector(':scope > [slot="comment"]');
      
      // Validate required fields
      if (!author || !commentElement) {
        return;
      }
      
      // Skip AutoModerator and invalid authors
      if (author === "AutoModerator" || typeof author !== 'string') {
        return;
      }

      // Parse and validate score
      const commentScore = score ? parseInt(score) : 0;
      if (isNaN(commentScore) || commentScore < 0) {
        return;
      }

      // Extract comment content
      const commentContent = Array.from(commentElement.querySelectorAll('p'))
        .map(p => p.innerText?.trim() || '')
        .filter(Boolean)
        .join('\n\n');

      // Add valid comment to post
      post.comments.push({
        author: author,
        content: commentContent,
        score: commentScore
      });
    } catch (error) {
      console.error('Error processing comment:', error);
      return;
    }
  });
  console.log('[DEBUG] Reddit Insight Data:', post);
  return post;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === 'getRedditData') {
      const data = extractRedditData();
      sendResponse({
        success: true,
        data: data
      });
    }
  } catch (error) {
    console.error('Reddit Insight Error:', error);
    sendResponse({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
  return true; // Keep message channel open for async response
});