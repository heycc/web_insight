import { SummaryService } from './summary';
import { ContentService, ContentData, ContentComment } from './content-service';

export interface YouTubeComment {
  author: string;
  content: string;
  likes: number | null;
  timestamp: string | null;
}

export interface YouTubeData {
  title: string | null;
  author: string | null;
  likes: string | null;
  comments: YouTubeComment[];
}

export class YouTubeService implements ContentService {
  private summaryService: SummaryService;

  constructor(summaryService?: SummaryService) {
    // Use the provided SummaryService or create a new one
    this.summaryService = summaryService || new SummaryService();
  }

  /**
   * Get the name of the site this service handles
   */
  getSiteName(): string {
    return 'YouTube';
  }

  /**
   * Extract YouTube data from the current tab
   */
  async extractData(): Promise<ContentData> {
    // Get the current active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      throw new Error('No active tab found');
    }
    
    const activeTab = tabs[0];
    
    // Check if we're on a YouTube video page
    if (!activeTab.url?.includes('youtube.com/watch')) {
      throw new Error('Not a YouTube video page');
    }
    
    if (!activeTab.id) {
      throw new Error('Tab ID is undefined');
    }
    
    // First check if content script is loaded by sending a ping
    try {
      await chrome.tabs.sendMessage(activeTab.id, { action: 'ping' });
    } catch (error) {
      throw new Error('Content script not loaded. Please refresh the YouTube page.');
    }
    
    // Execute script to extract data
    const results = await chrome.tabs.sendMessage(activeTab.id, { action: 'extractYouTubeData' });
    
    if (results && results.success) {
      // Convert YouTubeData to ContentData
      const youtubeData = results.data as YouTubeData;
      return {
        title: youtubeData.title,
        author: youtubeData.author,
        comments: youtubeData.comments.map(comment => ({
          author: comment.author,
          content: comment.content,
          score: comment.likes
        }))
      };
    } else {
      throw new Error(results?.error || 'Failed to extract data');
    }
  }

  /**
   * Get the raw YouTube data (for display purposes)
   */
  async getYouTubeData(): Promise<YouTubeData> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0 || !tabs[0].id) {
      throw new Error('No active tab found');
    }
    
    const results = await chrome.tabs.sendMessage(tabs[0].id, { action: 'extractYouTubeData' });
    
    if (results && results.success) {
      return results.data;
    } else {
      throw new Error(results?.error || 'Failed to extract data');
    }
  }

  /**
   * Convert YouTubeData to format for summarization
   */
  private convertToSummaryFormat(data: ContentData | YouTubeData) {
    // Check if this is YouTubeData with likes property
    const youtubeData = 'likes' in data ? data as YouTubeData : null;
    
    return {
      title: data.title || '',
      content: '', // YouTube videos don't have text content like Reddit posts
      author: data.author || '',
      score: youtubeData?.likes || '0',
      comments: data.comments.map(comment => ({
        author: comment.author,
        content: comment.content,
        // Convert null to 0 to avoid type issues
        score: ('likes' in comment ? (comment.likes || 0) : (comment.score || 0))
      }))
    };
  }

  /**
   * Summarize YouTube data
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