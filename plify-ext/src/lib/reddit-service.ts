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
    // Get the current active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      throw new Error('No active tab found');
    }
    
    const activeTab = tabs[0];
    
    // Check if we're on a Reddit page
    if (!activeTab.url?.includes('reddit.com')) {
      throw new Error('Not a Reddit page');
    }
    
    if (!activeTab.id) {
      throw new Error('Tab ID is undefined');
    }
    
    // First check if content script is loaded by sending a ping
    try {
      await chrome.tabs.sendMessage(activeTab.id, { action: 'ping' });
    } catch (error) {
      throw new Error('Content script not loaded. Please refresh the Reddit page.');
    }
    
    // Execute script to extract data
    const results = await chrome.tabs.sendMessage(activeTab.id, { action: 'extractRedditData' });
    
    if (results && results.success) {
      const redditPost = results.data as RedditPost;
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
      throw new Error(results?.error || 'Failed to extract data');
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
    
    const results = await chrome.tabs.sendMessage(tabs[0].id, { action: 'extractRedditData' });
    
    if (results && results.success) {
      return results.data;
    } else {
      throw new Error(results?.error || 'Failed to extract data');
    }
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