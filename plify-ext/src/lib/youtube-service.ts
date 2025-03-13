import { SummaryService } from './summary';
import { ContentService, ContentData } from './content-service';
import { createLogger } from './utils';

export interface YouTubeComment {
  author: string;
  content: string;
  likes: string | null;
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
  private logger;

  constructor(summaryService?: SummaryService) {
    // Use the provided SummaryService or create a new one
    this.summaryService = summaryService || new SummaryService();
    this.logger = createLogger('YouTube Service');
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
    this.logger.log('[YoutubeService] Starting extractData method');    
    // Get the current active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      this.logger.error('No active tab found');
      throw new Error('No active tab found');
    }
    
    const activeTab = tabs[0];
    this.logger.log(`Active tab URL: ${activeTab.url}`);
    
    // Check if we're on a YouTube site
    if (!activeTab.url?.includes('youtube.com')) {
      this.logger.error('Not a YouTube page');
      throw new Error('Not a YouTube page');
    }
    
    // Check if we're on a YouTube video page
    if (!activeTab.url?.includes('youtube.com/watch')) {
      this.logger.error('Not a YouTube video page');
      throw new Error('Please navigate to a YouTube video page to use this feature');
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
          files: ['content.js', 'youtube-content.js']
        });
        this.logger.log('Content script reloaded');
        
        // Try ping again
        await chrome.tabs.sendMessage(activeTab.id, { action: 'ping' });
      } catch (reloadError) {
        this.logger.error('Failed to reload content script:', reloadError);
        throw new Error('Content script not loaded. Please refresh the YouTube page.');
      }
    }
    
    // Use a fixed action name for extracting YouTube data
    const action = 'extract.youtube';
    
    // Execute script to extract data
    this.logger.log(`Extracting YouTube data with action: ${action}`);
    try {
      // Add a timeout to the sendMessage call to prevent infinite waiting
      const results = await Promise.race([
        chrome.tabs.sendMessage(activeTab.id, { action, from: 'youtube-service' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout waiting for response to action: ${action}`)), 5000))
      ]);

      if (results && results.success) {
        // Convert YouTubeData to ContentData
        const youtubeData = results.data as YouTubeData;
        this.logger.log(`Extracted YouTube data:`, {
          title: youtubeData.title,
          author: youtubeData.author,
          commentCount: youtubeData.comments?.length || 0
        });
        
        return {
          title: youtubeData.title,
          content: '',
          author: youtubeData.author,
          score: youtubeData.likes,
          comments: youtubeData.comments.map(comment => ({
            author: comment.author,
            content: comment.content,
            score: comment.likes
          }))
        };
      } else {
        const errorMessage = results?.error || `Failed to extract data with action: ${action}`;
        this.logger.error(errorMessage, results);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = `Error extracting data: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Get the raw YouTube data (for display purposes)
   */
  async getYouTubeData(): Promise<YouTubeData> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0 || !tabs[0].id) {
      this.logger.error('No active tab found');
      throw new Error('No active tab found');
    }
    
    try {
      const results = await chrome.tabs.sendMessage(tabs[0].id, { action: 'extract.youtube' });
      
      if (results && results.success) {
        this.logger.log('Successfully retrieved YouTube data');
        return results.data;
      } else {
        const errorMessage = results?.error || 'Failed to extract data';
        this.logger.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = `Error extracting data: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
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