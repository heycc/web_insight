import { AppController } from '../../modules/appController.js';
import { PostDisplayController } from '../../modules/postDisplayController.js';

document.addEventListener('DOMContentLoaded', () => {
  try {
    const app = new AppController();
    app.initialize();

    // Set up event listener for settings button
    document.querySelector('#settings-btn').addEventListener('click', () => {
      chrome.tabs.create({ url: 'pages/options/settings.html' });
    });

    // Set up event listener for refresh button - show content view, hide summary view
    document.querySelector('#refresh-btn').addEventListener('click', () => {
      // Show content view (post content and comments), hide summary view
      document.querySelectorAll('.content-view').forEach(el => el.classList.remove('hidden'));
      document.querySelector('.summary-view').classList.add('hidden');
      
      // Use the existing loadContent method from AppController
      app.loadContent();
    });

    // Set up event listener for summarize button - show summary view, hide content view
    document.querySelector('#summarize-btn').addEventListener('click', () => {
      // Show summary view, hide content view (post content and comments)
      document.querySelectorAll('.content-view').forEach(el => el.classList.add('hidden'));
      document.querySelector('.summary-view').classList.remove('hidden');
      
      // Use the existing summarizeContent method from AppController
      app.summarizeContent();
    });

  } catch (error) {
    console.error('App initialization failed:', error);
    PostDisplayController.showError('Failed to start application');
  }
});