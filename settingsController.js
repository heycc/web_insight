export class SettingsController {
  static SELECTORS = {
    saveSettingsButton: '#save-settings',
    apiUrlInput: '#api-url',
    apiKeyInput: '#api-key',
    modelNameInput: '#model-name',
    customPromptTextarea: '#custom-prompt'
  };

  constructor() {
    this.settings = {
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      apiKey: '',
      modelName: 'gpt-3.5-turbo',
      customPrompt: 'Analyze this Reddit post and its comments:'
    };
  }

  async initialize() {
    await this.loadSettings();
    this.setupEventListeners();
    this.applySettingsToUI();
  }

  setupEventListeners() {
    document.querySelector('#settings-btn').addEventListener('click', () => { // Changed selector to #settings-btn from sidebar.html
      chrome.tabs.create({ url: 'settings.html' });
    });
    document.querySelector(SettingsController.SELECTORS.saveSettingsButton).addEventListener('click', () => this.saveSettings());
  }

  async loadSettings() {
    const stored = await chrome.storage.sync.get(Object.keys(this.settings));
    Object.assign(this.settings, stored);
  }

  async saveSettings() {
    this.settings.apiUrl = document.querySelector(SettingsController.SELECTORS.apiUrlInput).value;
    this.settings.apiKey = document.querySelector(SettingsController.SELECTORS.apiKeyInput).value;
    this.settings.modelName = document.querySelector(SettingsController.SELECTORS.modelNameInput).value;
    this.settings.customPrompt = document.querySelector(SettingsController.SELECTORS.customPromptTextarea).value;
    await chrome.storage.sync.set(this.settings);
    console.log('Settings saved:', this.settings); // For debugging
  }

  applySettingsToUI() {
    document.querySelector(SettingsController.SELECTORS.apiUrlInput).value = this.settings.apiUrl;
    document.querySelector(SettingsController.SELECTORS.apiKeyInput).value = this.settings.apiKey;
    document.querySelector(SettingsController.SELECTORS.modelNameInput).value = this.settings.modelName;
    document.querySelector(SettingsController.SELECTORS.customPromptTextarea).value = this.settings.customPrompt;
  }

  toggleSettings() {
    this.isSettingsVisible = !this.isSettingsVisible;
    const settingsSection = document.querySelector(SettingsController.SELECTORS.settingsSection);
    settingsSection.classList.toggle('hidden', !this.isSettingsVisible);
  }
}