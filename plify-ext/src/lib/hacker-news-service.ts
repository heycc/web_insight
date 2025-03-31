import { SummaryService } from './summary';
import { ContentService, ContentData, ContentComment } from './content-service';
import { createLogger } from './utils';
import { BaseSiteService } from './base-site-service';

export interface HackerNewsComment {
  author: string | null;
  content: string;
}

export interface HackerNewsPost {
  title: string | null;
  url: string | null; // Link URL or item URL
  itemUrl: string | null; // HN Item URL
  content: string | null; // Text content if it's a self-post
  author: string | null;
  score: string | null; // Points
  age: string | null;
  commentCount: string | null;
  comments: HackerNewsComment[];
}

export class HackerNewsService extends BaseSiteService {
  constructor(summaryService?: SummaryService) {
    super(summaryService);
    this.logger = createLogger(this.getSiteName() + ' Service');
    this.logger.log('HackerNews service initialized');
  }

  getSiteName(): string {
    return 'HackerNews';
  }

  getSiteDomain(): string {
    return 'news.ycombinator.com';
  }

  getSiteContentScriptFilename(): string | null {
    return 'hacker-news-content.js';
  }

  isValidPage(url: string): boolean {
    // Matches item pages like https://news.ycombinator.com/item?id=...
    const hnItemRegex = /news\.ycombinator\.com\/item\?id=\d+/;
    return hnItemRegex.test(url);
  }

  getInvalidPageError(url: string | undefined): string {
    return 'Please navigate to a Hacker News item page (e.g., /item?id=...) to use this feature.';
  }

  convertRawDataToContentData(rawData: any, url: string): ContentData {
    const hnPost = rawData as HackerNewsPost;

    // HN doesn't have explicit comment scores, so we'll omit them
    // We can use the 'age' field if needed, but the base ContentComment doesn't have it.
    return {
      site: this.getSiteName(),
      url: hnPost.itemUrl || url, // Prefer the specific item URL
      title: hnPost.title,
      author: hnPost.author,
      // HN content can be null for link posts, represent it as empty string for consistency
      content: hnPost.content || '',
      score: hnPost.score, // Represents post points
      // Convert HN comments to the generic format
      comments: (hnPost.comments || []).map((comment: HackerNewsComment): ContentComment => ({
        author: comment.author || '',
        content: comment.content,
        score: null,
      }))
    };
  }

  // This format might need adjustment depending on how the summary service uses it.
  // For now, map fields similarly to the Reddit service.
  convertToSummaryFormat(data: ContentData) {
    return {
      title: data.title || '',
      url: data.url || '',
      content: data.content || '', // Main post content (if any)
      author: data.author || '',
      score: data.score || '0', // Post score (points)
      // Map comments, omitting score as it's not directly available/comparable
      comments: (data.comments || []).map(comment => ({
        author: comment.author || 'unknown',
        content: comment.content || '',
        score: 0, // Defaulting score to 0 as HN doesn't have comment scores
        // We could potentially include 'age' here if the summary model can use it
      }))
    };
  }
}
