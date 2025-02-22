import { PostDisplayController } from './postDisplayController.js';
import { RedditDataController } from './redditDataController.js';
// import { SettingsController } from './settingsController.js'; // Removed import

export class AppController {
  static SELECTORS = {
    refreshButton: '#refresh-btn',
    analyzeButton: '#analyze-btn', // Still in HTML, but not used in JS, consider removing from HTML as well
    summarizeButton: '#summarize-btn'
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
    document.querySelector(AppController.SELECTORS.summarizeButton).addEventListener('click', () => this.summarizeContent());
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
  
  async summarizeContent() {
    if (!this.currentData) {
      this.postDisplayController.showError('Please load content first');
      return;
    }

    try {
      // Get all settings from storage
      const { provider, apiKey, apiEndpoint, model } = await chrome.storage.local.get([
        'provider', 
        'apiKey',
        'apiEndpoint',
        'model'
      ]);
      console.log('Settings:', provider, apiKey, apiEndpoint, model);
      
      if (!provider || !apiKey || !apiEndpoint || !model) {
        throw new Error('Please configure all required settings (provider, API key, endpoint, and model)');
      }

      // Format data for LLM
      const prompt = `Please provide a clear and concise summary of this Reddit post and its top comments:

TITLE:
${this.currentData.title || 'No title'}

POST CONTENT:
${this.currentData.selftext || 'No content'}

TOP COMMENTS:
${this.currentData.comments && this.currentData.comments.length > 0 
  ? this.currentData.comments.slice(0, 5)
    .filter(c => c && c.body) // Add filter to ensure comment and body exist
    .map(c => `• ${c.body.trim()}`)
    .join('\n')
  : 'No comments'}

Please structure the summary in the following format:
1. Main point of the post
2. Key discussion points from comments
3. Overall sentiment/conclusion`;

      // Create response container
      const responseContainer = document.createElement('div');
      responseContainer.id = 'summary-response';
      responseContainer.style.marginTop = '20px';
      responseContainer.style.padding = '10px';
      responseContainer.style.backgroundColor = '#f5f5f5';
      responseContainer.style.borderRadius = '4px';
      document.querySelector('#comments').appendChild(responseContainer);

      // Make API call with correct endpoint and model
      const response = await fetch(`${apiEndpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that summarizes Reddit posts and their comments. Provide clear, concise summaries focusing on the main points and key discussions."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          stream: true
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            
            try {
              const json = JSON.parse(data);
              const text = json.choices[0].delta.content || '';
              result += text;
              responseContainer.textContent = result;
            } catch (error) {
              console.error('Error parsing stream:', error);
            }
          }
        }
      }
    } catch (error) {
      this.postDisplayController.showError(error.message);
    }
  }
}