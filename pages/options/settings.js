// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async function() {
  console.log('DOM fully loaded');

  // Default models
  const defaultModels = [
    'gpt-3.5-turbo',
    'gpt-4',
    'gpt-4-turbo',
    'claude-3-opus',
    'claude-3-sonnet'
  ];

  // Add default values for a profile
  const defaultProfile = {
    name: 'Default Profile',
    provider: 'openai',
    apiEndpoint: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini'
  };

  // Default settings structure with profiles
  const defaultSettings = {
    profiles: [defaultProfile],
    activeProfileIndex: 0,
    availableModels: defaultModels
  };

  let settings = {};
  let currentProfileIndex = 0;

  // DOM Elements
  const profileSelect = document.getElementById('profile-select');
  const profileName = document.getElementById('profile-name');
  const providerSelect = document.getElementById('provider');
  const apiEndpoint = document.getElementById('apiEndpoint');
  const apiKey = document.getElementById('apiKey');
  const modelSelect = document.getElementById('model');
  const newProfileBtn = document.getElementById('new-profile');
  const deleteProfileBtn = document.getElementById('delete-profile');
  const addModelBtn = document.getElementById('add-model');
  const customModelInput = document.getElementById('custom-model-input');
  const newModelName = document.getElementById('new-model-name');
  const saveModelBtn = document.getElementById('save-model');
  const cancelModelBtn = document.getElementById('cancel-model');
  const saveBtn = document.getElementById('save');

  try {
    // Load settings with Promise-based approach
    settings = await new Promise((resolve, reject) => {
      chrome.storage.local.get(null, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });

    console.log('Initial settings loaded:', settings);

    // Check if settings need to be migrated from old format
    // if (!settings.profiles && settings.apiKey) {
    //   console.log('Migrating old settings format to profiles...');
    //   settings = migrateOldSettings(settings);
    // }

    // Apply settings or defaults
    if (Object.keys(settings).length === 0 || !settings.profiles) {
      console.log('No settings found, using defaults...');
      settings = defaultSettings;
      
      // Save default settings
      await saveSettings(settings);
      console.log('Default settings saved');
    }

    // Initialize UI
    initializeUI();
    
  } catch (error) {
    console.error('Error loading settings:', error);
    showStatus('Error loading settings: ' + error.message, true);
    
    // Use defaults if error
    settings = defaultSettings;
    initializeUI();
  }

  // Function to migrate old settings format to new profile-based format
  // function migrateOldSettings(oldSettings) {
  //   const migratedProfile = {
  //     name: 'Migrated Profile',
  //     provider: oldSettings.provider || defaultProfile.provider,
  //     apiEndpoint: oldSettings.apiEndpoint || defaultProfile.apiEndpoint,
  //     apiKey: oldSettings.apiKey || defaultProfile.apiKey,
  //     model: oldSettings.model || defaultProfile.model
  //   };

  //   return {
  //     profiles: [migratedProfile],
  //     activeProfileIndex: 0,
  //     availableModels: [...defaultModels]
  //   };
  // }

  // Initialize UI with current settings
  function initializeUI() {
    // Populate profile selector
    populateProfileSelector();
    
    // Populate model selector
    populateModelSelector();
    
    // Set active profile
    currentProfileIndex = settings.activeProfileIndex || 0;
    profileSelect.selectedIndex = currentProfileIndex;
    
    // Load profile data
    loadProfileData(currentProfileIndex);
  }

  // Populate profile selector dropdown
  function populateProfileSelector() {
    profileSelect.innerHTML = '';
    settings.profiles.forEach((profile, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = profile.name;
      profileSelect.appendChild(option);
    });
  }

  // Populate model selector dropdown
  function populateModelSelector() {
    modelSelect.innerHTML = '';
    
    if (!settings.availableModels) {
      settings.availableModels = [...defaultModels];
    }
    
    settings.availableModels.forEach(model => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      modelSelect.appendChild(option);
    });
  }

  // Load profile data into form
  function loadProfileData(index) {
    const profile = settings.profiles[index];
    if (!profile) return;
    
    profileName.value = profile.name;
    providerSelect.value = profile.provider;
    apiEndpoint.value = profile.apiEndpoint;
    apiKey.value = profile.apiKey;
    
    // Select the correct model or default to first if not found
    const modelOption = Array.from(modelSelect.options).find(opt => opt.value === profile.model);
    if (modelOption) {
      modelSelect.value = profile.model;
    } else if (modelSelect.options.length > 0) {
      modelSelect.selectedIndex = 0;
    }
  }

  // Save current form data to profile
  function saveProfileData() {
    const profile = settings.profiles[currentProfileIndex];
    if (!profile) return;
    
    profile.name = profileName.value;
    profile.provider = providerSelect.value;
    profile.apiEndpoint = apiEndpoint.value;
    profile.apiKey = apiKey.value;
    profile.model = modelSelect.value;
    
    // Update profile name in selector
    const option = profileSelect.options[currentProfileIndex];
    if (option) {
      option.textContent = profile.name;
    }
  }

  // Save settings to storage
  async function saveSettings(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  // Event Listeners
  
  // Profile selection change
  profileSelect.addEventListener('change', function() {
    // Save current profile data before switching
    saveProfileData();
    
    // Update current profile index
    currentProfileIndex = parseInt(this.value);
    settings.activeProfileIndex = currentProfileIndex;
    
    // Load selected profile data
    loadProfileData(currentProfileIndex);
  });

  // New profile button
  newProfileBtn.addEventListener('click', function() {
    // Create new profile based on default
    const newProfile = {
      name: `Profile ${settings.profiles.length + 1}`,
      provider: defaultProfile.provider,
      apiEndpoint: defaultProfile.apiEndpoint,
      apiKey: '',
      model: defaultProfile.model
    };
    
    // Add to profiles array
    settings.profiles.push(newProfile);
    
    // Update profile selector
    const option = document.createElement('option');
    option.value = settings.profiles.length - 1;
    option.textContent = newProfile.name;
    profileSelect.appendChild(option);
    
    // Select new profile
    profileSelect.selectedIndex = settings.profiles.length - 1;
    currentProfileIndex = settings.profiles.length - 1;
    settings.activeProfileIndex = currentProfileIndex;
    
    // Load new profile data
    loadProfileData(currentProfileIndex);
  });

  // Delete profile button
  deleteProfileBtn.addEventListener('click', function() {
    // Don't delete if it's the only profile
    if (settings.profiles.length <= 1) {
      showStatus('Cannot delete the only profile', true);
      return;
    }
    
    // Remove profile from array
    settings.profiles.splice(currentProfileIndex, 1);
    
    // Update active profile index if needed
    if (currentProfileIndex >= settings.profiles.length) {
      currentProfileIndex = settings.profiles.length - 1;
    }
    settings.activeProfileIndex = currentProfileIndex;
    
    // Update UI
    populateProfileSelector();
    profileSelect.selectedIndex = currentProfileIndex;
    loadProfileData(currentProfileIndex);
  });

  // Add model button
  addModelBtn.addEventListener('click', function() {
    customModelInput.classList.remove('hidden');
    newModelName.focus();
  });

  // Save model button
  saveModelBtn.addEventListener('click', function() {
    const modelName = newModelName.value.trim();
    if (!modelName) {
      showStatus('Model name cannot be empty', true);
      return;
    }
    
    // Check if model already exists
    if (settings.availableModels.includes(modelName)) {
      showStatus('Model already exists', true);
      return;
    }
    
    // Add to available models
    settings.availableModels.push(modelName);
    
    // Add to dropdown
    const option = document.createElement('option');
    option.value = modelName;
    option.textContent = modelName;
    modelSelect.appendChild(option);
    
    // Select the new model
    modelSelect.value = modelName;
    
    // Hide custom model input
    customModelInput.classList.add('hidden');
    newModelName.value = '';
  });

  // Cancel model button
  cancelModelBtn.addEventListener('click', function() {
    customModelInput.classList.add('hidden');
    newModelName.value = '';
  });

  // Save settings button
  saveBtn.addEventListener('click', async function(e) {
    e.preventDefault();
    console.log('Save button clicked');

    try {
      // Save current profile data
      saveProfileData();
      
      // Validate
      const currentProfile = settings.profiles[currentProfileIndex];
      if (!currentProfile.name || !currentProfile.apiEndpoint || !currentProfile.apiKey || !currentProfile.model) {
        showStatus('All fields are required', true);
        return;
      }

      console.log('Attempting to save settings:', settings);
      
      // Save settings
      await saveSettings(settings);
      
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
});

function showStatus(message, isError = false) {
  console.log('Status:', message, 'isError:', isError);
  const status = document.getElementById('status');
  if (status) {
    status.textContent = message;
    status.style.color = isError ? 'red' : 'green';
    
    // Clear status after 3 seconds
    setTimeout(() => {
      status.textContent = '';
    }, 3000);
  }
}