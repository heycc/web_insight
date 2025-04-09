import { createBaseContentScript } from '../lib/base-content-script';
import { YouTubeData } from '../lib/youtube-service';
import { createLogger } from '../lib/utils';

// Define the highlighter function type
type HighlighterFunction = (username: string) => boolean;

// Define the loader function type
type LoaderFunction = () => Promise<boolean>; // Return true if loading triggered, false otherwise

// Add type definitions for window object
declare global {
  interface Window {
    __PLIFY_HIGHLIGHTERS?: {
      [siteName: string]: HighlighterFunction;
    };
    __PLIFY_LOADERS?: {
      [siteName: string]: LoaderFunction;
    };
  }
}

// Extract YouTube video and comment data
async function extractYouTubeData(): Promise<YouTubeData> {
  const logger = createLogger('YouTube Content');
  logger.log('Starting extractYouTubeData');
  
  // First, attempt to load more comments by scrolling multiple times
  await loadMoreCommentsMultipleTimes(5);
  
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

/**
 * Helper function to load more comments multiple times
 * @param maxAttempts Maximum number of scroll attempts
 */
async function loadMoreCommentsMultipleTimes(maxAttempts: number): Promise<void> {
  const logger = createLogger('YouTube Content');
  logger.log(`Attempting to load more comments up to ${maxAttempts} times`);
  
  let attempts = 0;
  let loadedMore = true;
  let totalCommentsLoaded = document.querySelectorAll('ytd-comment-thread-renderer').length;
  logger.log(`Starting with ${totalCommentsLoaded} comments`);
  
  while (attempts < maxAttempts && loadedMore) {
    attempts++;
    logger.log(`Scroll attempt ${attempts}/${maxAttempts}`);
    
    try {
      loadedMore = await loadMoreYouTubeComments();
      const currentCommentCount = document.querySelectorAll('ytd-comment-thread-renderer').length;
      
      if (!loadedMore) {
        logger.log(`No more comments loaded on attempt ${attempts}, stopping scroll attempts`);
        break;
      } else {
        logger.log(`Successfully loaded more comments: now at ${currentCommentCount} (added ${currentCommentCount - totalCommentsLoaded} new comments)`);
        totalCommentsLoaded = currentCommentCount;
      }
      
      // Wait longer between scroll attempts to ensure YouTube has time to process
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      logger.error('Error during automatic comment loading:', error instanceof Error ? error.message : String(error));
      break;
    }
  }
  
  logger.log(`Completed ${attempts} scroll attempts, loaded a total of ${totalCommentsLoaded} comments`);
  // After loading more comments, scroll to top
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/**
 * Attempts to load more YouTube comments by scrolling down
 * @returns Promise<boolean> - True if comments section was found and scrolled, false otherwise
 */
async function loadMoreYouTubeComments(): Promise<boolean> {
  const logger = createLogger('YouTube Content Loader');
  logger.log('Attempting to load more comments by scrolling');

  // First, find the comments section
  const commentsSection = document.querySelector('ytd-comments#comments');
  if (!commentsSection) {
    logger.log('Comments section not found');
    return false;
  }

  // Get all current comments
  const comments = document.querySelectorAll('ytd-comment-thread-renderer');
  
  // If there are comments, check if the last one is in view
  if (comments.length > 0) {
    const lastComment = comments[comments.length - 1];
    if (!isElementInViewport(lastComment)) {
      logger.log('Last comment not in view, scrolling to it, waiting 5 seconds');
      lastComment.scrollIntoView({ behavior: 'instant', block: 'start' });
      // Wait a bit for the scroll to complete and potentially trigger comment loading
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } else if (!isElementInViewport(commentsSection)) {
    // If no comments yet, check if comments section is in view
    logger.log('Comments section not in view, scrolling to it, waiting 5 seconds');
    commentsSection.scrollIntoView({ behavior: 'instant', block: 'start' });
    // Wait a bit for the scroll to complete and potentially trigger comment loading
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Count initial comments
  const initialCommentCount = document.querySelectorAll('ytd-comment-thread-renderer').length;
  
  if (initialCommentCount === 0) {
    logger.log('No comments found yet, waiting for initial comments to load');
    // If no comments are loaded yet, wait a bit more
    await new Promise(resolve => setTimeout(resolve, 5000));
    return false;
  } 
  
  logger.log(`Initial comment count: ${initialCommentCount}`);

  // Get the comments container which we'll scroll
  const commentsContainer = document.querySelector('ytd-item-section-renderer #contents');
  
  try {
    // Scroll past the current last comment to trigger loading more
    if (commentsContainer) {
      const containerHeight = commentsContainer.scrollHeight;
      window.scrollTo({
        top: window.scrollY + containerHeight,
        behavior: 'smooth'
      });
    } else {
      // Fallback to last comment scrolling if container not found
      const lastComment = document.querySelectorAll('ytd-comment-thread-renderer')[initialCommentCount - 1];
      if (lastComment) {
        logger.log(`Scrolling to the last comment (${initialCommentCount})`);
        lastComment.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Additional scroll to go beyond the last comment
        window.scrollBy({
          top: window.innerHeight * 0.5,
          behavior: 'smooth'
        });
      }
    }
    
    // Wait for potential new comments to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if new comments were loaded
    const newCommentCount = document.querySelectorAll('ytd-comment-thread-renderer').length;
    const loadedMore = newCommentCount > initialCommentCount;
    
    logger.log(`Comments before: ${initialCommentCount}, after: ${newCommentCount}`);
    return loadedMore;
  } catch (error) {
    logger.error(`Error scrolling to load more comments: ${error instanceof Error ? error.message : String(error)}`);
  }

  logger.log('No comments found to scroll to');
  return false;
}

/**
 * Helper function to check if an element is currently visible in the viewport
 */
function isElementInViewport(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
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
  
  // Ensure __PLIFY_LOADERS exists
  window.__PLIFY_LOADERS = window.__PLIFY_LOADERS || {};
  // Add the YouTube loader
  window.__PLIFY_LOADERS['youtube'] = loadMoreYouTubeComments;
}

export default script;