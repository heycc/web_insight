import { AppController } from './appController.js';

document.addEventListener('DOMContentLoaded', () => {
  try {
    const app = new AppController();
    app.initialize();

    // Set up event listener for settings button here, after DOM is loaded
    document.querySelector('#settings-btn').addEventListener('click', () => {
      chrome.tabs.create({ url: 'settings.html' });
    });

  } catch (error) {
    console.error('App initialization failed:', error);
    PostDisplayController.showError('Failed to start application'); // PostDisplayController is not imported here, remove or import if needed
  }
});