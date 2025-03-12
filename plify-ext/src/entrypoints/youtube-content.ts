import { defineContentScript } from 'wxt/sandbox';

export default defineContentScript({
  matches: ['*://*.youtube.com/watch*'],
  main() {
    console.log('[YouTube Insight] Content script loaded');
    
    // Extract YouTube video and comment data
    function extractYouTubeData() {
      // Get video title
      const videoTitle = document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.textContent?.trim() || null;
      
      // Get video author/channel
      const videoAuthor = document.querySelector('ytd-channel-name a')?.textContent?.trim() || null;
      
      // Get video likes (YouTube doesn't show exact count, just formatted)
      const videoLikes = document.querySelector('ytd-menu-renderer ytd-toggle-button-renderer:first-child yt-formatted-string')?.textContent?.trim() || null;
      
      interface YouTubeComment {
        author: string;
        content: string;
        likes: number | null;
        timestamp: string | null;
      }
      
      interface YouTubeData {
        title: string | null;
        author: string | null;
        likes: string | null;
        comments: YouTubeComment[];
      }
      
      const data: YouTubeData = {
        title: videoTitle,
        author: videoAuthor,
        likes: videoLikes,
        comments: []
      };

      // Extract comments
      const commentThreads = document.querySelectorAll('ytd-comment-thread-renderer');
      commentThreads.forEach(thread => {
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
          console.error('Error processing YouTube comment:', error instanceof Error ? error.message : String(error));
          return;
        }
      });
      
      console.log('[YouTube Insight] Data:', data);
      return data;
    }

    // Listen for messages from popup or background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      try {
        // Handle ping to check if content script is loaded
        if (request.action === 'ping') {
          sendResponse({ success: true });
          return true; // No need to keep channel open for ping
        }
        
        if (request.action === 'getYouTubeData' || request.action === 'extractYouTubeData') {
          const data = extractYouTubeData();
          sendResponse({
            success: true,
            data: data
          });
          return false; // Data is sent synchronously, no need to keep channel open
        }
        
        // If we reach here, we didn't handle the action
        sendResponse({ 
          success: false, 
          error: `Unknown action: ${request.action}` 
        });
        return false; // No need to keep channel open
      } catch (error: unknown) {
        console.error('YouTube Insight Error:', error instanceof Error ? error.message : String(error));
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        return false; // Error already sent, no need to keep channel open
      }
    });
  },
}); 