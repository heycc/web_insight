import { PostDisplayController } from './postDisplayController.js';
import { RedditDataController } from './redditDataController.js';
import { SummaryService } from './summaryService.js';

export class AppController {
  static SELECTORS = {
    refreshButton: '#refresh-btn',
    summarizeButton: '#summarize-btn',
    settingsButton: '#settings-btn',
    contentView: '.content-view',
    summaryView: '.summary-view',
    summaryResponse: '#summary-response'
  };

  constructor() {
    this.currentData = null;
    this.postDisplayController = PostDisplayController;
    this.redditDataController = RedditDataController;
    this.summaryService = new SummaryService();
  }

  async initialize() {
    try {
      this.setupEventListeners();
      this.loadContent();
    } catch (error) {
      console.error('Initialization error:', error);
      this.postDisplayController.showError('Failed to initialize: ' + error.message);
    }
  }

  setupEventListeners() {
    // Settings button
    document.querySelector(AppController.SELECTORS.settingsButton).addEventListener('click', () => {
      chrome.tabs.create({ url: 'pages/options/settings.html' });
    });

    // Refresh button
    document.querySelector(AppController.SELECTORS.refreshButton).addEventListener('click', () => {
      document.querySelectorAll(AppController.SELECTORS.contentView).forEach(el => el.classList.remove('hidden'));
      document.querySelector(AppController.SELECTORS.summaryView).classList.add('hidden');
      this.loadContent();
    });

    // Summarize button
    document.querySelector(AppController.SELECTORS.summarizeButton).addEventListener('click', () => {
      document.querySelectorAll(AppController.SELECTORS.contentView).forEach(el => el.classList.add('hidden'));
      document.querySelector(AppController.SELECTORS.summaryView).classList.remove('hidden');
      this.summarizeContent();
    });
  }

  async loadContent() {
    try {
      console.log('Loading content...');
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      if (!tabs[0].url.includes('reddit.com')) {
        throw new Error('Not a Reddit page');
      }

      this.currentData = await this.redditDataController.fetchPageData(tabs[0].id);
      this.postDisplayController.updatePostDisplay(this.currentData);
      this.postDisplayController.updateComments(this.currentData.comments || []);
    } catch (error) {
      this.postDisplayController.showError(error.message);
    }
  }

  async analyzeContent() {
    if (!this.currentData) {
      this.postDisplayController.showError('Please load content first');
      return;
    }

    try {
      this.postDisplayController.showError('Analysis feature is not implemented yet.'); // Placeholder message
    } catch (error) {
      this.postDisplayController.showError(error.message);
    }
  }
  
  async summarizeContent() {
    if (!this.currentData) {
      this.postDisplayController.showError('Please load content first');
      return;
    }

    try {
      const responseContainer = document.querySelector(AppController.SELECTORS.summaryResponse);
      const { contentDiv, cursorSpan } = this.createStreamingUI(responseContainer);

      let result = '';
      for await (const text of this.summaryService.streamSummary(this.currentData)) {
        result += text;
        this.updateContent(contentDiv, result);
      }

      responseContainer.removeChild(cursorSpan);
    } catch (error) {
      this.postDisplayController.showError(error.message);
    }
  }

  createStreamingUI(container) {
    container.innerHTML = '';
    const cursorSpan = document.createElement('span');
    cursorSpan.classList.add('streaming-cursor');
    cursorSpan.textContent = '🛬'; // Use airplane landing emoji
    const contentDiv = document.createElement('div');
    container.appendChild(contentDiv);
    container.appendChild(cursorSpan);
    return { contentDiv, cursorSpan };
  }

  updateContent(contentDiv, content) {
    if (window.marked) {
      contentDiv.innerHTML = marked.parse(content);
    } else {
      contentDiv.textContent = content;
    }
  }
}