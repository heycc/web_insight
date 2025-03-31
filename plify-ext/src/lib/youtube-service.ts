import { SummaryService } from './summary';
import { ContentService, ContentData, ContentComment } from './content-service';
import { createLogger } from './utils';
import { BaseSiteService } from './base-site-service';

export interface YouTubeComment {
  author: string;
  content: string;
  likes: string | null;
  timestamp: string | null;
}

export interface YouTubeData {
  title: string | null;
  url: string | null;
  author: string | null;
  likes: string | null;
  comments: YouTubeComment[];
}

export class YouTubeService extends BaseSiteService {
  constructor(summaryService?: SummaryService) {
    super(summaryService);
    this.logger = createLogger(this.getSiteName() + ' Service');
  }

  getSiteName(): string {
    return 'YouTube';
  }

  getSiteDomain(): string {
    return 'youtube.com';
  }

  getSiteContentScriptFilename(): string | null {
    return 'youtube-content.js';
  }

  isValidPage(url: string): boolean {
    return url.includes('youtube.com/watch');
  }

  getInvalidPageError(url: string | undefined): string {
    return 'Please navigate to a YouTube video page (e.g., youtube.com/watch?v=...) to use this feature.';
  }

  convertRawDataToContentData(rawData: any, url: string): ContentData {
    const youtubeData = rawData as YouTubeData;
    this.logger.log(`Converting raw YouTube data to ContentData`, {
      title: youtubeData.title,
      author: youtubeData.author,
      commentCount: youtubeData.comments?.length || 0
    });

    return {
      site: this.getSiteName(),
      url: url,
      title: youtubeData.title,
      content: null,
      author: youtubeData.author,
      score: youtubeData.likes,
      comments: (youtubeData.comments || []).map((comment: YouTubeComment): ContentComment => ({
        author: comment.author,
        content: comment.content,
        score: comment.likes != null ? String(comment.likes) : null
      }))
    };
  }

  convertToSummaryFormat(data: ContentData) {
    this.logger.log('Converting ContentData to SummaryService format');
    return {
      title: data.title || '',
      url: data.url || '',
      content: '',
      author: data.author || '',
      score: data.score || '0',
      comments: (data.comments || []).map(comment => ({
        author: comment.author,
        content: comment.content,
        score: comment.score || 0
      }))
    };
  }
} 