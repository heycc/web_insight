import { createBaseContentScript } from '../lib/base-content-script';
import { YouTubeData, YouTubeComment } from '../lib/youtube-service';

// Log that this script has been loaded
console.log('[YouTube Content] Script is being evaluated');

// Extract YouTube video and comment data
function extractYouTubeData(): YouTubeData {
  console.log('[YouTube Content] Starting extractYouTubeData function');
  
  // Get video title
  const videoTitle = document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.textContent?.trim() || null;
  
  // Get video author/channel
  const videoAuthor = document.querySelector('ytd-channel-name a')?.textContent?.trim() || null;
  
  // Get video likes (YouTube doesn't show exact count, just formatted)
  const videoLikes = document.querySelector('ytd-menu-renderer ytd-toggle-button-renderer:first-child yt-formatted-string')?.textContent?.trim() || null;
  
  const data: YouTubeData = {
    title: videoTitle,
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
      const author = authorElement?.textContent?.trim();
      
      // Get comment content
      const contentElement = thread.querySelector('#expander #content');
      const content = contentElement?.textContent?.trim();
      
      // Get comment likes
      const likesElement = thread.querySelector('#action-buttons #like-count');
      let likes: number | null = null;
      if (likesElement?.textContent) {
        const likesText = likesElement.textContent.trim();
        // Convert text like "1.2K" to number (approximate)
        if (likesText) {
          if (likesText.includes('K')) {
            likes = parseFloat(likesText.replace('K', '')) * 1000;
          } else {
            likes = parseInt(likesText, 10);
          }
          if (isNaN(likes)) likes = null;
        }
      }
      
      // Get comment timestamp
      const timestampElement = thread.querySelector('#header-author .published-time-text');
      const timestamp = timestampElement?.textContent?.trim() || null;
      
      // Validate required fields
      if (!author || !content) {
        console.log(`[YouTube Content] Skipping comment #${index}: missing author or content`);
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
      console.error('[YouTube Content] Error processing YouTube comment:', error instanceof Error ? error.message : String(error));
      return;
    }
  });
  
  console.log(`[YouTube Content] Total comments extracted: ${data.comments.length}`);
  return data;
}

// Create and export the YouTube content script
const script = createBaseContentScript<YouTubeData>({
  siteName: 'YouTube',
  matches: ['*://*.youtube.com/*'],
  extractDataFunction: extractYouTubeData
});

export default script; 