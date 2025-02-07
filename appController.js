import { PostDisplayController } from './postDisplayController.js';
import { RedditDataController } from './redditDataController.js';
// import { SettingsController } from './settingsController.js'; // Removed import

export class AppController {
  static SELECTORS = {
    refreshButton: '#refresh-btn',
    analyzeButton: '#analyze-btn', // Still in HTML, but not used in JS, consider removing from HTML as well
  };

  constructor() {
    this.currentData = null;
    this.postDisplayController = PostDisplayController;
    this.redditDataController = RedditDataController;
    // this.settingsController = new SettingsController(); // Removed initialization
  }

  async initialize() {
    try {
      // await this.settingsController.initialize(); // Removed settingsController initialization
      this.setupEventListeners();
      this.loadContent();
    } catch (error) {
      console.error('Initialization error:', error);
      this.postDisplayController.showError('Failed to initialize: ' + error.message);
    }
  }

  setupEventListeners() {
    document.querySelector(AppController.SELECTORS.refreshButton).addEventListener('click', () => this.loadContent());
    // document.querySelector(AppController.SELECTORS.analyzeButton).addEventListener('click', () => this.analyzeContent()); // Analyze button is commented out in original sidebar.js
  }

  async loadContent() {
    try {
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
      // Analysis logic (commented out in original sidebar.js)
      // const analysis = await this.analyzer.analyze(this.currentData, this.currentData.comments || []);
      // const contentElement = document.querySelector(SELECTORS.postContent);
      // if (contentElement) {
      //   contentElement.innerHTML = analysis.replace(/\n/g, '<br>');
      // } else {
      //   throw new Error('Content display element not found');
      // }
      this.postDisplayController.showError('Analysis feature is not implemented yet.'); // Placeholder message
    } catch (error) {
      this.postDisplayController.showError(error.message);
    }
  }
}