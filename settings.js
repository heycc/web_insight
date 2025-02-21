// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add console log to verify DOM loading
  console.log('DOM fully loaded');

  // Load saved settings
  chrome.storage.sync.get(['provider', 'apiEndpoint', 'apiKey', 'model'], function(settings) {
    console.log('Loading settings:', settings);
    document.getElementById('provider').value = settings.provider || 'openai';
    document.getElementById('apiEndpoint').value = settings.apiEndpoint || 'https://api.openai.com/v1';
    document.getElementById('apiKey').value = settings.apiKey || '';
    document.getElementById('model').value = settings.model || '';
  });

  // Move save button event listener inside DOMContentLoaded
  const saveButton = document.getElementById('save');
  if (saveButton) {
    console.log('Save button found');
    saveButton.addEventListener('click', function(e) {
      console.log('Save button clicked');
      e.preventDefault();

      try {
        const settings = {
          provider: document.getElementById('provider').value,
          apiEndpoint: document.getElementById('apiEndpoint').value,
          apiKey: document.getElementById('apiKey').value,
          model: document.getElementById('model').value
        };

        console.log('Saving settings:', settings);

        // Validate required fields
        if (!settings.apiEndpoint || !settings.apiKey || !settings.model) {
          showStatus('All fields are required', true);
          return;
        }

        // Save settings
        chrome.storage.sync.set(settings, function() {
          if (chrome.runtime.lastError) {
            console.error('Error saving settings:', chrome.runtime.lastError);
            showStatus('Error saving settings: ' + chrome.runtime.lastError.message, true);
            return;
          }
          showStatus('Settings saved successfully!');
          // Notify background script of changes
          chrome.runtime.sendMessage({type: 'settingsUpdated', settings: settings});
        });
      } catch (error) {
        console.error('Error in save handler:', error);
        showStatus('An error occurred: ' + error.message, true);
      }
    });
  } else {
    console.error('Save button not found in DOM');
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