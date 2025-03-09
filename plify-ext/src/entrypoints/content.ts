import { defineContentScript } from 'wxt/sandbox';

export default defineContentScript({
  matches: ['*://*.reddit.com/*'],
  main() {
    console.log('[Reddit Insight] Content script loaded');
    
    // Extract Reddit post and comment data
    function extractRedditData() {
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
      
      interface RedditPost {
        title: string | null;
        content: string;
        author: string | null;
        score: string | null;
        comments: RedditComment[];
      }
      
      interface RedditComment {
        author: string;
        content: string;
        score: number;
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
          console.error('Error processing comment:', error instanceof Error ? error.message : String(error));
          return;
        }
      });
      console.log('[Reddit Insight] Data:', post);
      return post;
    }

    // Listen for messages from popup or background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      try {
        // Handle ping to check if content script is loaded
        if (request.action === 'ping') {
          sendResponse({ success: true });
          return true; // No need to keep channel open for ping
        }
        
        if (request.action === 'getRedditData' || request.action === 'extractRedditData') {
          const data = extractRedditData();
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
        console.error('Reddit Insight Error:', error instanceof Error ? error.message : String(error));
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
