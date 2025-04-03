import { createBaseContentScript } from '../lib/base-content-script';
import { HackerNewsPost, HackerNewsComment } from '../lib/hacker-news-service';
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

// Extract Hacker News post and comment data
function extractHackerNewsData(): HackerNewsPost {
  const logger = createLogger('HackerNews Content');
  logger.log('Starting extractHackerNewsData');

  const post: HackerNewsPost = {
    title: null,
    url: null,
    itemUrl: window.location.href,
    content: null,
    author: null,
    score: null,
    age: null,
    commentCount: null,
    comments: []
  };

  // Extract Post Details (Top Thing)
  const titleElement = document.querySelector('.fatitem .athing.submission');
  const subtextElement = document.querySelector('.fatitem .subtext .subline');

  if (titleElement) {
    post.title = (titleElement as HTMLElement).querySelector('.titleline > a')?.textContent || null;
    post.url = (titleElement as HTMLAnchorElement).href;
  }

  if (subtextElement) {
    // const scoreElement = subtextElement.querySelector('.score');
    const userElement = subtextElement.querySelector('.hnuser');
    const ageElement = subtextElement.querySelector('.age a'); // Link inside age span
    const commentsLinkElement = Array.from(subtextElement.querySelectorAll('a')).pop(); // Usually the last link

    // post.score = scoreElement ? (scoreElement as HTMLElement).textContent?.replace(' points', '') || null : null;
    post.author = userElement ? (userElement as HTMLElement).textContent || null : null;
    post.age = ageElement ? (ageElement as HTMLElement).textContent || null : null;

    if (commentsLinkElement && (commentsLinkElement as HTMLElement).textContent?.includes('comment')) {
        post.commentCount = (commentsLinkElement as HTMLElement).textContent?.replace(/&nbsp;|\scomments?/g, '') || null;
    }
  }

  // Extract Self-Post Content (if present)
  // Self-posts have extra rows after the subtext for the content
  // const selfPostElement = document.querySelector('.athing + tr + tr .commtext');
  // if (selfPostElement) {
  //     post.content = (selfPostElement as HTMLElement).innerText;
  // } else if (post.url && post.url.startsWith(window.location.origin + '/item?id=')) {
  //     // If the title link points back to the item itself, it's likely a self-post with no text
  //     post.content = '<no text content>';
  // }


  // Extract Comments
  const commentTree = document.querySelector('.comment-tree');
  if (commentTree) {
    const commentElements = commentTree.querySelectorAll('.comtr');

    commentElements.forEach((commentElement, index) => {
      try {
        const authorElement = commentElement.querySelector('.hnuser');
        const ageElement = commentElement.querySelector('.age a');
        const commentTextElement = commentElement.querySelector('.commtext');
        // HN doesn't show comment scores publicly

        // Basic validation
        if (!commentTextElement) {
          logger.log(`Skipping comment #${index}: missing comment text element`);
          return;
        }

        const author = authorElement?.textContent?.trim() || null;
        const age = ageElement?.textContent?.trim() || null;
        let content = commentTextElement?.innerHTML || ''; // Use innerHTML to preserve formatting like italics/code

        // Simple cleaning of the content (optional, adjust as needed)
        content = content.replace(/<p>/g, '\n\n').replace(/<\/?i>/g, '*').replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, '```\n$1\n```').replace(/<a href="(.*?)" rel="nofollow">.*?<\/a>/g, '$1').replace(/<.*?>/g, '').trim(); // Basic markdown-like conversion + link extraction

        // Skip deleted comments
        if (commentTextElement.textContent?.includes('[dead]') || commentTextElement.textContent?.includes('[flagged]')) {
           logger.log(`Skipping comment #${index}: [dead] or [flagged]`);
           return;
        }
        if (content === '[deleted]') {
             logger.log(`Skipping comment #${index}: [deleted]`);
             return;
        }
        post.comments.push({
          author: author,
          content: content,
        });
      } catch (error: unknown) {
        logger.error(`Error processing comment #${index}:`, error instanceof Error ? error.message : String(error));
      }
    });
  }

  logger.log(`Post title: ${post.title}, comments: ${post.comments.length}`);
  return post;
}

/**
 * Highlights comments by a specific author on Hacker News for 5 seconds
 * @param username The username to highlight
 * @returns true if any comments were found and highlighted
 */
function highlightHackerNewsComments(username: string): boolean {
  const comments = document.querySelectorAll('.comment-tree .comtr');
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
    const authorElement = comment.querySelector('.hnuser');
    const author = authorElement?.textContent?.trim();
    
    if (author && author.toLowerCase() === username.toLowerCase()) {
      // Highlight this comment
      comment.classList.add('plify-highlighted-comment');
      (comment as HTMLElement).style.backgroundColor = highlightColor;
      highlightedElements.push(comment as HTMLElement);
      
      // Scroll to the first highlighted comment
      if (!found) {
        comment.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

// Create and export the Hacker News content script
const script = createBaseContentScript<HackerNewsPost>({
  siteName: 'HackerNews',
  matches: ['*://news.ycombinator.com/item?id=*'], // Specific match for item pages
  extractDataFunction: extractHackerNewsData
});

// Register the highlight function in the window object
if (typeof window !== 'undefined') {
  // Ensure __PLIFY_HIGHLIGHTERS exists
  window.__PLIFY_HIGHLIGHTERS = window.__PLIFY_HIGHLIGHTERS || {};
  // Add the Hacker News highlighter
  window.__PLIFY_HIGHLIGHTERS['hackernews'] = highlightHackerNewsComments;
}

export default script;
