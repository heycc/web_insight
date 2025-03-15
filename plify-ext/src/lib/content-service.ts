import { SummaryService } from './summary';

// Generic content data interface that can be extended by specific site implementations
export interface ContentData {
  site: string;
  url: string;
  title: string | null;
  content: string | null;
  author: string | null;
  score: string | null;
  comments: ContentComment[];
}

export interface ContentComment {
  author: string;
  content: string;
  score: string | null;
}

// Base content service interface
export interface ContentService {
  extractData(): Promise<ContentData>;
  summarizeData(data: ContentData): AsyncGenerator<{ type: 'content' | 'reasoning', text: string }, void, unknown>;
  stopSummarization(): void;
  getSummaryService(): SummaryService;
  getSiteName(): string;
}

// Site detection utility
export class SiteDetector {
  static async getCurrentSite(): Promise<string> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      throw new Error('No active tab found');
    }
    
    const url = tabs[0].url || '';

    if (url.includes('reddit.com')) {
      return 'reddit';
    } else if (url.includes('youtube.com')) {     
      return 'youtube';
    } else {
      return 'unknown';
    }
  }
}

// Factory to create the appropriate content service
export class ContentServiceFactory {
  static async createService(summaryService: SummaryService): Promise<ContentService> {
    const site = await SiteDetector.getCurrentSite();
    
    // Dynamically import the appropriate service
    if (site === 'reddit') {
      const { RedditService } = await import('./reddit-service');
      return new RedditService(summaryService);
    } else if (site === 'youtube') {
      const { YouTubeService } = await import('./youtube-service');
      return new YouTubeService(summaryService);
    } else {
      throw new Error(`Unsupported site: ${site}`);
    }
  }
} 