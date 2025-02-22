// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async function() {
  console.log('DOM fully loaded');

  // Add default values
  const defaultSettings = {
    provider: 'openai',
    apiEndpoint: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-3.5-turbo'
  };

  try {
    // Load settings with Promise-based approach
    const settings = await new Promise((resolve, reject) => {
      chrome.storage.local.get(null, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });

    console.log('Initial settings loaded:', settings);

    // Apply settings or defaults
    document.getElementById('provider').value = settings.provider || defaultSettings.provider;
    document.getElementById('apiEndpoint').value = settings.apiEndpoint || defaultSettings.apiEndpoint;
    document.getElementById('apiKey').value = settings.apiKey || defaultSettings.apiKey;
    document.getElementById('model').value = settings.model || defaultSettings.model;

    // Save initial settings if empty
    if (Object.keys(settings).length === 0) {
      console.log('No settings found, saving defaults...');
      await new Promise((resolve, reject) => {
        chrome.storage.local.set(defaultSettings, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
      console.log('Default settings saved');
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    showStatus('Error loading settings: ' + error.message, true);
  }

  const saveButton = document.getElementById('save');
  if (saveButton) {
    saveButton.addEventListener('click', async function(e) {
      e.preventDefault();
      console.log('Save button clicked');

      try {
        const newSettings = {
          provider: document.getElementById('provider').value,
          apiEndpoint: document.getElementById('apiEndpoint').value,
          apiKey: document.getElementById('apiKey').value,
          model: document.getElementById('model').value
        };

        console.log('Attempting to save settings:', newSettings);

        // Validate
        if (!newSettings.apiEndpoint || !newSettings.apiKey || !newSettings.model) {
          showStatus('All fields are required', true);
          return;
        }

        // Save with Promise-based approach
        await new Promise((resolve, reject) => {
          chrome.storage.local.set(newSettings, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });

        console.log('Settings saved successfully');
        showStatus('Settings saved successfully!');

        // Verify save
        const savedSettings = await new Promise((resolve) => {
          chrome.storage.local.get(null, resolve);
        });
        console.log('Verified saved settings:', savedSettings);

      } catch (error) {
        console.error('Error saving settings:', error);
        showStatus('Error saving settings: ' + error.message, true);
      }
    });
  }
});

function showStatus(message, isError = false) {
  console.log('Status:', message, 'isError:', isError);
  const status = document.getElementById('status');
  if (status) {
    status.textContent = message;
    status.style.color = isError ? 'red' : 'green';
  }
}