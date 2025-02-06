import { AppController } from './appController.js';

document.addEventListener('DOMContentLoaded', () => {
  try {
    const app = new AppController();
    app.initialize();
  } catch (error) {
    console.error('App initialization failed:', error);
    PostDisplayController.showError('Failed to start application'); // PostDisplayController is not imported here, remove or import if needed
  }
});