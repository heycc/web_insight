import { createBaseContentScript } from '../lib/base-content-script';
import { YouTubeData } from '../lib/youtube-service';
import { createLogger } from '../lib/utils';

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

// Create and export the YouTube content script
const script = createBaseContentScript<YouTubeData>({
  siteName: 'YouTube',
  matches: ['*://*.youtube.com/*'],
  extractDataFunction: extractYouTubeData
});

export default script; 