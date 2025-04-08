import { createBaseContentScript } from '../lib/base-content-script';
import { RedditPost } from '../lib/reddit-service';
import { createLogger } from '../lib/utils';

// Define the highlighter function type
type HighlighterFunction = (username: string) => boolean;

// Add type definitions for window object
declare global {
  interface Window {
    __PLIFY_HIGHLIGHTERS?: {
      [siteName: string]: HighlighterFunction;
    };
  }
}

// Extract Reddit post and comment data
function extractRedditData(): RedditPost {
  const logger = createLogger('Reddit Content');
  logger.log('Starting extractRedditData');

  // Extract the post content
  const postElement = document.querySelector('shreddit-post');
  const textBody = postElement?.querySelectorAll('[slot="text-body"] p');
  const hasMedia = postElement?.querySelector('[slot="post-media-container"]');

  let postContent: string;
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
    url: window.location.href || null,
    content: postContent,
    author: postElement?.getAttribute('author') || null,
    score: postElement?.getAttribute('score') || null,
    comments: []
  };

  // Extract comments
  const commentElements = document.querySelectorAll(
    'shreddit-comment[depth="0"], shreddit-comment[depth="1"], shreddit-comment[depth="2"]'
  );
  commentElements.forEach((comment, index) => {
    try {
      const author = comment.getAttribute('author');
      const score = comment.getAttribute('score');
      const commentElement = comment.querySelector(':scope > [slot="comment"]');

      if (author === '[deleted]') {
        logger.log(`Skipping comment #${index}: deleted author`);
        return;
      }

      // Validate required fields
      if (!author || !commentElement) {
        logger.log(`Skipping comment #${index}: missing author or comment element`);
        return;
      }

      // Skip AutoModerator and invalid authors
      if (author === "AutoModerator" || typeof author !== 'string') {
        logger.log(`Skipping comment #${index}: AutoModerator or invalid author`);
        return;
      }

      // Parse and validate score
      const commentScore = score ? parseInt(score) : 0;
      if (isNaN(commentScore) || commentScore < 0) {
        logger.log(`Skipping comment #${index}: invalid score`);
        return;
      }

      // Extract comment content. innerText is not working for collapsed comments
      const commentContent = Array.from(commentElement.querySelectorAll('p'))
      .map(p => (p as HTMLElement).textContent?.trim() || '')
      .filter(Boolean)
      .join('\n\n');

      // Add valid comment to post
      post.comments.push({
        author: author,
        content: commentContent,
        score: commentScore
      });
    } catch (error: unknown) {
      logger.error(`Error processing comment #${index}:`, error instanceof Error ? error.message : String(error));
      return;
    }
  });

  logger.log(`Total comments extracted: ${post.comments.length}`);
  return post;
}

/**
 * Highlights comments by a specific author on Reddit for 5 seconds
 * @param username The username to highlight
 * @returns true if any comments were found and highlighted
 */
function highlightRedditComments(username: string): boolean {
  const comments = document.querySelectorAll('shreddit-comment');
  let found = false;
  const highlightColor = 'rgba(121, 224, 238, 0.25)'; // Light blue with transparency
  
  // Remove any existing highlights
  document.querySelectorAll('.plify-highlighted-comment').forEach(el => {
    el.classList.remove('plify-highlighted-comment');
    (el as HTMLElement).style.backgroundColor = '';
  });
  
  // Store highlighted elements to remove highlighting after timeout
  const highlightedElements: HTMLElement[] = [];
  
  comments.forEach(comment => {
    const author = comment.getAttribute('author');
    if (author && author.toLowerCase() === username.toLowerCase()) {
      // Highlight this comment
      comment.classList.add('plify-highlighted-comment');
      (comment as HTMLElement).style.backgroundColor = highlightColor;
      highlightedElements.push(comment as HTMLElement);
      
      // Ensure the comment is visible (expand if collapsed)
      if (comment.hasAttribute('collapsed')) {
        // Remove the collapsed attribute to expand the comment
        comment.removeAttribute('collapsed');
      }
      
      // Scroll to the first highlighted comment
      if (!found) {
        // Get the first child element to scroll to instead of the entire comment
        const commentFirstChild = comment.firstElementChild as HTMLElement;
        if (commentFirstChild) {
          commentFirstChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          // Fallback to the comment itself if no child element exists
          comment.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        found = true;
      }
    }
  });
  
  // Remove highlighting after 5 seconds
  setTimeout(() => {
    highlightedElements.forEach(element => {
      element.classList.remove('plify-highlighted-comment');
      element.style.backgroundColor = '';
    });
  }, 5000);
  
  return found;
}

// Create and export the Reddit content script
const script = createBaseContentScript<RedditPost>({
  siteName: 'Reddit',
  matches: ['*://*.reddit.com/*'],
  extractDataFunction: extractRedditData
});

// Register the highlight function in the window object
// so the main content script can call it
if (typeof window !== 'undefined') {
  // Ensure __PLIFY_HIGHLIGHTERS exists
  window.__PLIFY_HIGHLIGHTERS = window.__PLIFY_HIGHLIGHTERS || {};
  // Add the Reddit highlighter
  window.__PLIFY_HIGHLIGHTERS['reddit'] = highlightRedditComments;
}

export default script;