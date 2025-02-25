import { PostDisplayController } from './postDisplayController.js';
import { RedditDataController } from './redditDataController.js';
// import { SettingsController } from './settingsController.js'; // Removed import

export class AppController {
  static SELECTORS = {
    refreshButton: '#refresh-btn',
    analyzeButton: '#analyze-btn', // Still in HTML, but not used in JS, consider removing from HTML as well
    summarizeButton: '#summarize-btn',
    settingsButton: '#settings-btn',
    contentView: '.content-view',
    summaryView: '.summary-view'
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

    // document.querySelector(AppController.SELECTORS.analyzeButton).addEventListener('click', () => this.analyzeContent()); // Analyze button is commented out in original sidebar.js
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
      // Log the received data for debugging
      console.log('Current data:', this.currentData);

      // Get all settings from storage
      const { provider, apiKey, apiEndpoint, model } = await chrome.storage.local.get([
        'provider', 
        'apiKey',
        'apiEndpoint',
        'model'
      ]);
      // console.log('Settings:', provider, apiKey, apiEndpoint, model);
      
      if (!provider || !apiKey || !apiEndpoint || !model) {
        throw new Error('Please configure all required settings (provider, API key, endpoint, and model)');
      }

      const title = this.currentData.title || 'No title';
      const postContent = this.currentData.content || 'No content';
      const commentsList = (this.currentData.comments || [])
        .filter(c => c && c.content)
        .slice(0, 5)
        .map(c => `• ${c.content.trim()}`)
        .join('\n')
        || 'No comments';

      // Format data for LLM
      const prompt = `Please provide a clear and concise summary of this Reddit post and its top comments:

TITLE:
${title}

POST CONTENT:
${postContent}

TOP COMMENTS:
${commentsList}

Please structure the summary in the following format:
1. Main point of the post
2. Key discussion points from comments
3. Overall sentiment/conclusion`;

      // Clear previous content
      // Clear content areas but preserve containers
      document.querySelector('#post-content').innerHTML = '';
      document.querySelector('#comments-list').innerHTML = '';
      document.querySelector('#summary-response').innerHTML = '';

      // Reference existing summary container
      const responseContainer = document.querySelector('#summary-response');
      responseContainer.innerHTML = ''; // Clear initial content

      // Create cursor element
      const cursorSpan = document.createElement('span');
      cursorSpan.classList.add('streaming-cursor');
      responseContainer.appendChild(cursorSpan);

      // Create a content div to hold the markdown content
      const contentDiv = document.createElement('div');
      responseContainer.insertBefore(contentDiv, cursorSpan);

      // Make API call using the correct endpoint and model
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

      // Set up marked.js options for security
      if (window.marked) {
        marked.setOptions({
          sanitize: true, // Sanitize HTML input
          gfm: true, // GitHub Flavored Markdown
          breaks: true, // Convert line breaks to <br>
          smartLists: true // Use smart lists
        });
      }

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
              
              // Update content div while preserving cursor
              if (window.marked) {
                contentDiv.innerHTML = marked.parse(result);
              } else {
                contentDiv.textContent = result;
              }
            } catch (error) {
              console.error('Error parsing stream:', error);
            }
          }
        }
      }

      // Remove cursor after stream completes
      responseContainer.removeChild(cursorSpan);
    } catch (error) {
      this.postDisplayController.showError(error.message);
    }
  }
}