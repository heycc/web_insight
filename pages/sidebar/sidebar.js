import { AppController } from '../../modules/appController.js';
import { PostDisplayController } from '../../modules/postDisplayController.js';

document.addEventListener('DOMContentLoaded', () => {
  try {
    const app = new AppController();
    app.initialize();
  } catch (error) {
    console.error('App initialization failed:', error);
    PostDisplayController.showError('Failed to start application');
  }
});