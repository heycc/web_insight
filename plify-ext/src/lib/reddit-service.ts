import { SummaryService } from './summary';
import { ContentService, ContentData, ContentComment } from './content-service';
import { createLogger } from './utils';
import { BaseSiteService } from './base-site-service';

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

export class RedditService extends BaseSiteService {
  constructor(summaryService?: SummaryService) {
    super(summaryService);
    this.logger = createLogger(this.getSiteName() + ' Service');
  }

  getSiteName(): string {
    return 'Reddit';
  }

  getSiteDomain(): string {
    return 'reddit.com';
  }

  getSiteContentScriptFilename(): string | null {
    return 'reddit-content.js';
  }

  isValidPage(url: string): boolean {
    const redditPostRegex = /reddit\.com\/r\/[^\/]+\/comments\/[^\/]+/;
    return redditPostRegex.test(url);
  }

  getInvalidPageError(url: string | undefined): string {
    return 'Please navigate to a Reddit post page (e.g., /r/subreddit/comments/...) to use this feature.';
  }

  convertRawDataToContentData(rawData: any, url: string): ContentData {
    const redditPost = rawData as RedditPost;
    this.logger.log(`Converting raw Reddit data to ContentData`, {
      title: redditPost.title,
      author: redditPost.author,
      commentCount: redditPost.comments?.length || 0
    });

    return {
      site: this.getSiteName(),
      url: url,
      title: redditPost.title,
      author: redditPost.author,
      content: redditPost.content,
      score: redditPost.score,
      comments: (redditPost.comments || []).map((comment: RedditComment): ContentComment => ({
        author: comment.author,
        content: comment.content,
        score: comment.score != null ? String(comment.score) : null
      }))
    };
  }

  convertToSummaryFormat(data: ContentData) {
    this.logger.log('Converting ContentData to SummaryService format');
    return {
      title: data.title || '',
      url: data.url || '',
      content: data.content || '',
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