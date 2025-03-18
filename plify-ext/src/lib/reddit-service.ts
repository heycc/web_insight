import { SummaryService } from './summary';
import { ContentService, ContentData } from './content-service';
import { createLogger } from './utils';

export interface RedditComment {
  author: string;
  content: string;
  score: string | number;
}

export interface RedditPost {
  title: string | null;
  url: string | null;
  content: string;
  author: string | null;
  score: string | null;
  comments: RedditComment[];
}

export class RedditService implements ContentService {
  private summaryService: SummaryService;
  private logger;

  constructor(summaryService?: SummaryService) {
    // Use the provided SummaryService or create a new one
    this.summaryService = summaryService || new SummaryService();
    this.logger = createLogger('Reddit Service');
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
    this.logger.log('Starting extractData method');
    // Get the current active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      this.logger.error('No active tab found');
      throw new Error('No active tab found');
    }
    
    const activeTab = tabs[0];
    this.logger.log(`Active tab URL: ${activeTab.url}`);
    
    // Check if we're on a Reddit page
    if (!activeTab.url?.includes('reddit.com')) {
      this.logger.error('Current Site is not supported');
      throw new Error('Current Site is not supported');
    }

    // Check if we're on a Reddit post page using regex
    const redditPostRegex = /reddit\.com\/r\/[^\/]+\/comments\/[^\/]+/;
    if (!activeTab.url || !redditPostRegex.test(activeTab.url)) {
      this.logger.error('Not a Reddit post page');
      throw new Error('Please navigate to a Reddit post page to use this feature. (e.g. https://www.reddit.com/r/AskReddit/comments/xxx/xxx/)');
    }
    
    if (!activeTab.id) {
      this.logger.error('Tab ID is undefined');
      throw new Error('Tab ID is undefined');
    }
    
    // First check if content script is loaded by sending a ping
    try {
      this.logger.log(`Sending ping to tab ${activeTab.id}`);
      const pingResponse = await chrome.tabs.sendMessage(activeTab.id, { action: 'ping' });
      this.logger.log(`Ping response:`, pingResponse);
    } catch (error) {
      this.logger.error('Ping failed:', error);
      
      // Try to reload the content script
      this.logger.log('Attempting to reload content script...');
      try {
        // This will execute the content script again if it's not already loaded
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ['content.js', 'reddit-content.js']
        });
        this.logger.log('Content script reloaded');
        
        // Try ping again
        await chrome.tabs.sendMessage(activeTab.id, { action: 'ping' });
      } catch (reloadError) {
        this.logger.error('Failed to reload content script:', reloadError);
        throw new Error('Content script not loaded. Please refresh the page.');
      }
    }
    
    // Use a fixed action name for extracting Reddit data
    const action = 'extract.reddit';
    
    this.logger.log(`Extracting data with action: ${action}`);
    try {
      // Add a timeout to the sendMessage call to prevent infinite waiting
      const results = await Promise.race([
        chrome.tabs.sendMessage(activeTab.id, { action, from: 'reddit-service' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout waiting for response to action: ${action}`)), 5000))
      ]);
      
      if (results && results.success) {       
        const redditPost = results.data as RedditPost;
        this.logger.log(`Extracted Reddit post:`, {
          title: redditPost.title,
          author: redditPost.author,
          commentCount: redditPost.comments?.length || 0
        });
        
        // Convert RedditPost to ContentData
        return {
          site: this.getSiteName(),
          url: activeTab.url,
          title: redditPost.title,
          author: redditPost.author,
          content: redditPost.content,
          score: redditPost.score,
          comments: redditPost.comments.map(comment => ({
            author: comment.author,
            content: comment.content,
            score: comment.score as string
          }))
        };
      } else {
        const errorMessage = results?.error || `Failed to extract data with action: ${action}`;
        this.logger.error(`${errorMessage}`, results);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = `Error extracting data: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(`${errorMessage}`);
      throw new Error(errorMessage);
    }
  }

  /**
   * Get the raw Reddit data (for display purposes)
   */
  async getRedditPost(): Promise<RedditPost> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0 || !tabs[0].id) {
      throw new Error('No active tab found');
    }
    
    // Use a fixed action name
    const action = 'extract.reddit';
    
    try {
      const results = await chrome.tabs.sendMessage(tabs[0].id, { action });
      
      if (results && results.success) {
        return results.data;
      } else {
        const errorMessage = results?.error || `Failed to extract data with action: ${action}`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = `Error extracting data: ${error instanceof Error ? error.message : String(error)}`;
      throw new Error(errorMessage);
    }
  }

  /**
   * Convert RedditPost to RedditData format for summarization
   */
  private convertToSummaryFormat(data: ContentData | RedditPost) {
    // Check if this is RedditPost with content property
    const redditPost = 'content' in data ? data as RedditPost : null;
    
    return {
      title: data.title || '',
      url: data.url || '',
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
  async* summarizeData(data: ContentData, customPrompt?: string): AsyncGenerator<{ type: 'content' | 'reasoning', text: string }, void, unknown> {
    const summaryData = this.convertToSummaryFormat(data);
    yield* this.summaryService.streamSummary(summaryData, customPrompt);
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