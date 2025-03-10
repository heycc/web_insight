import { SummaryService, RedditData } from './summary';

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

export class RedditService {
  private summaryService: SummaryService;

  constructor(summaryService?: SummaryService) {
    // Use the provided SummaryService or create a new one
    this.summaryService = summaryService || new SummaryService();
  }

  /**
   * Extract Reddit data from the current tab
   */
  async extractData(): Promise<RedditPost> {
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
      return results.data;
    } else {
      throw new Error(results?.error || 'Failed to extract data');
    }
  }

  /**
   * Convert RedditPost to RedditData format for summarization
   */
  private convertToSummaryFormat(post: RedditPost): RedditData {
    return {
      title: post.title || '',
      content: post.content || '',
      author: post.author || '',
      score: post.score || '0',
      comments: post.comments.map(comment => ({
        author: comment.author,
        content: comment.content,
        score: comment.score
      }))
    };
  }

  /**
   * Summarize Reddit data
   */
  async* summarizeData(post: RedditPost): AsyncGenerator<{ type: 'content' | 'reasoning', text: string }, void, unknown> {
    const summaryData = this.convertToSummaryFormat(post);
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