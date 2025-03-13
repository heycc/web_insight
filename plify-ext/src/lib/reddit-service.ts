import { SummaryService, RedditData } from './summary';
import { ContentService, ContentData, ContentComment } from './content-service';

export interface RedditComment {
  author: string;
  content: string;
  score: number;
}

export interface RedditPost {
  title: string | null;
  content: string;
  author: string | null;
  score: string | null;
  comments: RedditComment[];
}

export class RedditService implements ContentService {
  private summaryService: SummaryService;

  constructor(summaryService?: SummaryService) {
    // Use the provided SummaryService or create a new one
    this.summaryService = summaryService || new SummaryService();
  }

  /**
   * Get the name of the site this service handles
   */
  getSiteName(): string {
    return 'Reddit';
  }

  /**
   * Extract Reddit data from the current tab
   */
  async extractData(): Promise<ContentData> {
    console.log('[RedditService] Starting extractData method');
    // Get the current active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      console.error('[RedditService] No active tab found');
      throw new Error('No active tab found');
    }
    
    const activeTab = tabs[0];
    console.log(`[RedditService] Active tab URL: ${activeTab.url}`);
    
    // Check if we're on a Reddit page
    if (!activeTab.url?.includes('reddit.com')) {
      console.error('[RedditService] Not a Reddit page');
      throw new Error('Not a Reddit page');
    }
    
    if (!activeTab.id) {
      console.error('[RedditService] Tab ID is undefined');
      throw new Error('Tab ID is undefined');
    }
    
    // First check if content script is loaded by sending a ping
    try {
      console.log(`[RedditService] Sending ping to tab ${activeTab.id}`);
      const pingResponse = await chrome.tabs.sendMessage(activeTab.id, { action: 'ping' });
      console.log(`[RedditService] Ping response:`, pingResponse);
    } catch (error) {
      console.error('[RedditService] Ping failed:', error);
      
      // Try to reload the content script
      console.log('[RedditService] Attempting to reload content script...');
      try {
        // This will execute the content script again if it's not already loaded
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ['content.js', 'reddit-content.js']
        });
        console.log('[RedditService] Content script reloaded');
        
        // Try ping again
        await chrome.tabs.sendMessage(activeTab.id, { action: 'ping' });
      } catch (reloadError) {
        console.error('[RedditService] Failed to reload content script:', reloadError);
        throw new Error('Content script not loaded. Please refresh the Reddit page.');
      }
    }
    
    // Try different action names to extract data
    const actionNames = [
      // New consistent naming convention
      'extract.reddit',
      'get.reddit',
      
      // Legacy naming conventions for backward compatibility
      'extractRedditData',
      'getRedditData',
      'extractredditdata',
      'getredditdata'
    ];
    
    let lastError = null;
    
    // Try each action name until one works
    for (const action of actionNames) {
      console.log(`[RedditService] Trying to extract data with action: ${action}`);
      try {
        // Add a timeout to the sendMessage call to prevent infinite waiting
        const results = await Promise.race([
          chrome.tabs.sendMessage(activeTab.id, { action, from: 'reddit-service' }),
          new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout waiting for response to action: ${action}`)), 5000))
        ]);
        
        console.log(`[RedditService] Extract data response for action ${action}:`, results);
        
        if (results && results.success) {
          console.log(`[RedditService] Successfully extracted data with action: ${action}, source:`, results.source);
          
          const redditPost = results.data as RedditPost;
          console.log(`[RedditService] Extracted Reddit post:`, {
            title: redditPost.title,
            author: redditPost.author,
            commentCount: redditPost.comments?.length || 0
          });
          
          // Convert RedditPost to ContentData
          return {
            title: redditPost.title,
            author: redditPost.author,
            comments: redditPost.comments.map(comment => ({
              author: comment.author,
              content: comment.content,
              score: comment.score
            }))
          };
        } else {
          lastError = results?.error || `Failed to extract data with action: ${action}`;
          console.error(`[RedditService] ${lastError}`, results);
        }
      } catch (error) {
        lastError = `Error with action ${action}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`[RedditService] ${lastError}`);
      }
    }
    
    // If we get here, all attempts failed
    console.error(`[RedditService] All extraction attempts failed. Last error: ${lastError}`);
    throw new Error(lastError || 'Failed to extract data after trying all action names');
  }

  /**
   * Get the raw Reddit data (for display purposes)
   */
  async getRedditPost(): Promise<RedditPost> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0 || !tabs[0].id) {
      throw new Error('No active tab found');
    }
    
    // Try different action names
    const actionNames = ['extract.reddit', 'extractRedditData'];
    let lastError = null;
    
    for (const action of actionNames) {
      try {
        const results = await chrome.tabs.sendMessage(tabs[0].id, { action });
        
        if (results && results.success) {
          return results.data;
        } else {
          lastError = results?.error || `Failed to extract data with action: ${action}`;
        }
      } catch (error) {
        lastError = `Error with action ${action}: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
    
    throw new Error(lastError || 'Failed to extract data');
  }

  /**
   * Convert RedditPost to RedditData format for summarization
   */
  private convertToSummaryFormat(data: ContentData | RedditPost): RedditData {
    // Check if this is RedditPost with content property
    const redditPost = 'content' in data ? data as RedditPost : null;
    
    return {
      title: data.title || '',
      content: redditPost?.content || '',
      author: data.author || '',
      score: redditPost?.score || '0',
      comments: data.comments.map(comment => ({
        author: comment.author,
        content: comment.content,
        score: comment.score || 0
      }))
    };
  }

  /**
   * Summarize Reddit data
   */
  async* summarizeData(data: ContentData): AsyncGenerator<{ type: 'content' | 'reasoning', text: string }, void, unknown> {
    const summaryData = this.convertToSummaryFormat(data);
    yield* this.summaryService.streamSummary(summaryData);
  }
  
  /**
   * Stop the summarization process
   */
  stopSummarization(): void {
    this.summaryService.abortStream();
  }

  /**
   * Get the SummaryService instance
   */
  getSummaryService(): SummaryService {
    return this.summaryService;
  }
} 