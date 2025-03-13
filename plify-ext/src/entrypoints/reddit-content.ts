import { createBaseContentScript } from '../lib/base-content-script';
import { RedditPost, RedditComment } from '../lib/reddit-service';

// Log that this script has been loaded
console.log('[Reddit Content] Script is being evaluated');

// Extract Reddit post and comment data
function extractRedditData(): RedditPost {
  console.log('[Reddit Content] Starting extractRedditData function');
  
  const postElement = document.querySelector('shreddit-post');
  
  let postContent: string;
  
  const textBody = postElement?.querySelectorAll('[slot="text-body"] p');
  const hasMedia = postElement?.querySelector('[slot="post-media-container"]');
  
  if (textBody && textBody.length > 0) {
    postContent = Array.from(textBody)
      .map(p => (p as HTMLElement).innerText)
      .join('\n\n');
  } else if (hasMedia) {
    postContent = '<hint: author post a media, no text>';
  } else {
    postContent = '<no content>';
  }
  
  const post: RedditPost = {
    title: postElement?.getAttribute('post-title') || null,
    content: postContent,
    author: postElement?.getAttribute('author') || null,
    score: postElement?.getAttribute('score') || null,
    comments: []
  };

  // Extract comments
  const commentElements = document.querySelectorAll('shreddit-comment[depth="0"], shreddit-comment[depth="1"]');
  
  commentElements.forEach((comment, index) => {
    try {
      const author = comment.getAttribute('author');
      const score = comment.getAttribute('score');
      const commentElement = comment.querySelector(':scope > [slot="comment"]');
      
      // Validate required fields
      if (!author || !commentElement) {
        console.log(`[Reddit Content] Skipping comment #${index}: missing author or comment element`);
        return;
      }
      
      // Skip AutoModerator and invalid authors
      if (author === "AutoModerator" || typeof author !== 'string') {
        console.log(`[Reddit Content] Skipping comment #${index}: AutoModerator or invalid author`);
        return;
      }

      // Parse and validate score
      const commentScore = score ? parseInt(score) : 0;
      if (isNaN(commentScore) || commentScore < 0) {
        console.log(`[Reddit Content] Skipping comment #${index}: invalid score`);
        return;
      }

      // Extract comment content
      const commentContent = Array.from(commentElement.querySelectorAll('p'))
        .map(p => (p as HTMLElement).innerText?.trim() || '')
        .filter(Boolean)
        .join('\n\n');

      // Add valid comment to post
      post.comments.push({
        author: author,
        content: commentContent,
        score: commentScore
      });
    } catch (error: unknown) {
      console.error(`[Reddit Content] Error processing comment #${index}:`, error instanceof Error ? error.message : String(error));
      return;
    }
  });
  
  console.log(`[Reddit Content] Total comments extracted: ${post.comments.length}`);
  return post;
}

// Create and export the Reddit content script
const script = createBaseContentScript<RedditPost>({
  siteName: 'Reddit',
  matches: ['*://*.reddit.com/*'],
  extractDataFunction: extractRedditData
});

export default script; 