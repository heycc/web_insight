// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add console log to verify DOM loading
  console.log('DOM fully loaded');

  // Load saved settings
  chrome.storage.sync.get(['theme', 'showSidebar', 'refreshInterval'], function(settings) {
    console.log('Loading settings:', settings);
    document.getElementById('theme').value = settings.theme || 'light';
    document.getElementById('showSidebar').checked = settings.showSidebar || false;
    document.getElementById('refreshInterval').value = settings.refreshInterval || 5;
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
          theme: document.getElementById('theme').value,
          showSidebar: document.getElementById('showSidebar').checked,
          refreshInterval: parseInt(document.getElementById('refreshInterval').value)
        };

        console.log('Saving settings:', settings);

        // Validate refresh interval
        if (isNaN(settings.refreshInterval) || settings.refreshInterval < 1 || settings.refreshInterval > 60) {
          showStatus('Refresh interval must be between 1 and 60 minutes', true);
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