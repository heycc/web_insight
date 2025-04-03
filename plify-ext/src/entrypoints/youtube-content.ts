import { createBaseContentScript } from '../lib/base-content-script';
import { YouTubeData } from '../lib/youtube-service';
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

// Extract YouTube video and comment data
function extractYouTubeData(): YouTubeData {
  const logger = createLogger('YouTube Content');
  logger.log('Starting extractYouTubeData');
  
  // Get video title
  const videoTitle = document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.textContent?.trim() || null;
  
  // Get video author/channel
  const videoAuthor = document.querySelector('ytd-channel-name a')?.textContent?.trim().replace(/^@/, '') || null;
  
  // Get video likes (YouTube doesn't show exact count, just formatted)
  const videoLikes = document.querySelector(
    'ytd-watch-metadata ytd-menu-renderer segmented-like-dislike-button-view-model like-button-view-model'
  )?.textContent?.trim() || null;
  
  const data: YouTubeData = {
    title: videoTitle,
    url: window.location.href || null,
    author: videoAuthor,
    likes: videoLikes,
    comments: []
  };

  // Extract comments
  const commentThreads = document.querySelectorAll('ytd-comment-thread-renderer');
  
  commentThreads.forEach((thread, index) => {
    try {
      // Get comment author
      const authorElement = thread.querySelector('#header-author #author-text');
      const author = authorElement?.textContent?.trim().replace(/^@/, '');
      
      // Get comment content
      const contentElement = thread.querySelector('#expander #content');
      const content = contentElement?.textContent?.trim();
      
      // Get comment likes
      const likesElement = thread.querySelector('ytd-comment-engagement-bar #toolbar #vote-count-middle');
      let likes: string | null = null;
      if (likesElement?.textContent) {
        const likesText = likesElement.textContent.trim();
        // Keep the original formatted text (like "1.2K")
        if (likesText) {
          likes = likesText;
        }
      }
      
      // Get comment timestamp
      const timestampElement = thread.querySelector('#header-author .published-time-text');
      const timestamp = timestampElement?.textContent?.trim() || null;
      
      // Validate required fields
      if (!author || !content) {
        logger.log(`Skipping comment #${index}: missing author or content`);
        return;
      }

      // Add valid comment to data
      data.comments.push({
        author,
        content,
        likes,
        timestamp
      });
    } catch (error: unknown) {
      logger.error('Error processing YouTube comment:', error instanceof Error ? error.message : String(error));
      return;
    }
  });
  
  logger.log(`Total comments extracted: ${data.comments.length}`);
  return data;
}

/**
 * Highlights comments by a specific author on YouTube for 5 seconds
 * @param username The username to highlight
 * @returns true if any comments were found and highlighted
 */
function highlightYouTubeComments(username: string): boolean {
  const commentThreads = document.querySelectorAll('ytd-comment-thread-renderer');
  let found = false;
  const highlightColor = 'rgba(121, 224, 238, 0.25)'; // Light blue with transparency
  
  // Remove any existing highlights
  document.querySelectorAll('.plify-highlighted-comment').forEach(el => {
    el.classList.remove('plify-highlighted-comment');
    (el as HTMLElement).style.backgroundColor = '';
  });
  
  // Store highlighted elements to remove highlighting after timeout
  const highlightedElements: HTMLElement[] = [];
  
  commentThreads.forEach(thread => {
    const authorElement = thread.querySelector('#header-author #author-text');
    if (authorElement && authorElement.textContent) {
      const author = authorElement.textContent.trim().replace(/^@/, '');
      if (author.toLowerCase() === username.toLowerCase()) {
        // Highlight this comment
        thread.classList.add('plify-highlighted-comment');
        (thread as HTMLElement).style.backgroundColor = highlightColor;
        highlightedElements.push(thread as HTMLElement);
        
        // If the comment isn't expanded, expand it
        const expandButton = thread.querySelector('#more-button');
        if (expandButton && (expandButton as HTMLElement).offsetParent !== null) {
          (expandButton as HTMLElement).click();
        }
        
        // Scroll to the first highlighted comment
        if (!found) {
          thread.scrollIntoView({ behavior: 'smooth', block: 'center' });
          found = true;
        }
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

// Create and export the YouTube content script
const script = createBaseContentScript<YouTubeData>({
  siteName: 'YouTube',
  matches: ['*://*.youtube.com/*'],
  extractDataFunction: extractYouTubeData
});

// Register the highlight function in the window object
// so the main content script can call it
if (typeof window !== 'undefined') {
  // Ensure __PLIFY_HIGHLIGHTERS exists
  window.__PLIFY_HIGHLIGHTERS = window.__PLIFY_HIGHLIGHTERS || {};
  // Add the YouTube highlighter
  window.__PLIFY_HIGHLIGHTERS['youtube'] = highlightYouTubeComments;
}

export default script; 