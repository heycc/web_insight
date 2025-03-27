import React, { useState, useEffect } from 'react';
import { Toaster } from "../../components/ui/toaster";
import { useToast } from "../../components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';

import { createLogger } from "../../lib/utils";
import { 
  APIProfilesSection, 
  LanguagePreference, 
  PrivacyNotice,
  Prompts,
  About,
  FontSizePreference,
  FontSizeProvider
} from '../../components/settings';
import { 
  Profile,
  Settings,
  ProviderType,
  Language,
  ProfileFormValues,
  Prompt,
  DEFAULT_PROMPT,
  FontSize
} from '../../components/settings/types';

const DEFAULT_PROFILE: Profile = {
  index: 0,
  profile_name: 'Default Profile',
  provider_type: ProviderType.OAI_COMPATIBLE,
  api_endpoint: '',
  api_key: '',
  model_name: '',
  temperature: 0.6
};

const App = () => {
  const [settings, setSettings] = useState<Settings>({
    profiles: [],
    theme: 'system',
    language: Language.EN,
    prompts: [],
    fontSize: FontSize.MEDIUM
  });

  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profiles");

  const { toast } = useToast();
  const logger = createLogger('Settings');

  useEffect(() => {
    loadSettings();
  }, []);

  // Listen for font size changes from storage
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes.fontSize) {
        setSettings(prev => ({
          ...prev,
          fontSize: changes.fontSize.newValue
        }));
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const result = await chrome.storage.local.get(['profiles', 'theme', 'language', 'prompts', 'fontSize']);
      logger.log('Loaded from storage:', result);

      // Check if we need to add the default prompt
      const defaultPrompts = result.prompts && result.prompts.length > 0 
        ? result.prompts 
        : [DEFAULT_PROMPT];
          
      // If we're adding the default prompt for the first time, save it to storage
      if (!result.prompts || result.prompts.length === 0) {
        try {
          await chrome.storage.local.set({ prompts: defaultPrompts });
          logger.log('Added default prompt to storage');
          toast({
            title: "Default prompt added",
            description: "A default prompt template has been added to your library.",
            variant: "default",
          });
        } catch (storageError) {
          logger.error('Error saving default prompt to storage:', storageError);
          // Even if saving fails, we'll still use the default prompt in-memory
        }
      }

      if (result.profiles && result.profiles.length > 0) {
        // Ensure model_name is properly set for each profile
        const validatedProfiles = result.profiles.map((profile: Profile) => ({
          ...profile,
          model_name: profile.model_name || '' // Ensure model_name is never undefined
        }));

        setSettings({
          profiles: validatedProfiles,
          theme: result.theme || 'system',
          language: result.language || 'en',
          prompts: defaultPrompts,
          fontSize: result.fontSize || FontSize.MEDIUM
        });
        // Set the first profile as active
        setActiveProfile(validatedProfiles[0]);
      } else {
        // No profiles found
        setSettings({
          profiles: [],
          theme: result.theme || 'system',
          language: result.language || 'en',
          prompts: defaultPrompts,
          fontSize: result.fontSize || FontSize.MEDIUM
        });
      }
    } catch (error) {
      logger.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (currentSettings: Settings | null = null) => {
    try {
      // Use provided settings or get from state
      const settingsToSave = currentSettings || {
        profiles: settings.profiles,
        theme: settings.theme,
        language: settings.language,
        prompts: settings.prompts,
        fontSize: settings.fontSize
      };

      logger.log('Saving settings:', settingsToSave);
      await chrome.storage.local.set(settingsToSave);
    } catch (error) {
      logger.error('Error saving settings:', error);
      toast({
        title: "Failed to save settings",
        description: "There was an error saving your settings. Please try again later.",
        variant: "destructive",
      });
    }
  };

  /*
   * This function handles language preference changes from the LanguagePreference component.
   * We update the local state immediately to reflect the change in the UI,
   * and also persist the change to storage to ensure it's available across sessions.
   * The language setting is maintained at the App level because it affects the entire application
   * and needs to be accessible to multiple components.
   */
  const handleSaveLanguage = (newLanguage: Language) => {
    setSettings(prev => ({
      ...prev,
      language: newLanguage
    }));

    // Save the updated language setting immediately
    saveSettings({
      profiles: settings.profiles,
      theme: settings.theme,
      language: newLanguage,
      prompts: settings.prompts,
      fontSize: settings.fontSize
    });
  };

  const handleSaveFontSize = (newFontSize: FontSize) => {
    setSettings(prev => ({
      ...prev,
      fontSize: newFontSize
    }));

    // Save the updated font size setting immediately
    saveSettings({
      profiles: settings.profiles,
      theme: settings.theme,
      language: settings.language,
      prompts: settings.prompts,
      fontSize: newFontSize
    });
  };

  const addNewProfile = () => {
    // Find the maximum index among existing profiles
    const maxIndex = settings.profiles.length > 0
      ? Math.max(...settings.profiles.map(profile => profile.index))
      : -1;
    
    const newProfile: Profile = {
      ...DEFAULT_PROFILE,
      index: maxIndex + 1,
      profile_name: `Profile ${settings.profiles.length + 1}`,
    };

    setActiveProfile(newProfile);
    setIsEditing(true);
  };

  const handleProfileFormSubmit = (data: ProfileFormValues) => {
    if (!activeProfile) return;

    const updatedProfile: Profile = {
      ...activeProfile,
      profile_name: data.profile_name,
      provider_type: data.provider_type,
      api_endpoint: data.api_endpoint,
      api_key: data.api_key,
      model_name: data.model_name,
      temperature: data.temperature
    };

    // Log the updated profile to verify model_name is being set correctly
    logger.log('Updated profile before saving:', updatedProfile);

    let updatedProfiles: Profile[] = [];

    // If this is a new profile, add it to the list
    if (!settings.profiles.find(p => p.index === activeProfile.index)) {
      updatedProfiles = [...settings.profiles, updatedProfile];
      setSettings(prev => ({
        ...prev,
        profiles: updatedProfiles
      }));
    } else {
      // Otherwise update the existing profile
      updatedProfiles = settings.profiles.map(p =>
        p.index === activeProfile.index ? updatedProfile : p
      );
      setSettings(prev => ({
        ...prev,
        profiles: updatedProfiles
      }));
    }

    setActiveProfile(updatedProfile);
    setIsEditing(false);

    // Save the updated settings immediately with the new profiles array
    saveSettings({
      profiles: updatedProfiles,
      theme: settings.theme,
      language: settings.language,
      prompts: settings.prompts,
      fontSize: settings.fontSize
    });
  };

  const editProfile = () => {
    if (!activeProfile) return;
    setIsEditing(true);
  };

  const deleteProfile = () => {
    if (!activeProfile) return;

    setSettings(prev => {
      const updatedProfiles = prev.profiles.filter(p => p.index !== activeProfile.index);

      // If we deleted the last profile, set activeProfile to null
      if (updatedProfiles.length === 0) {
        setActiveProfile(null);
      } else {
        // Otherwise set the first profile as active
        setActiveProfile(updatedProfiles[0]);
      }

      // Save the updated profiles to storage
      saveSettings({
        profiles: updatedProfiles,
        theme: prev.theme,
        language: prev.language,
        prompts: prev.prompts,
        fontSize: prev.fontSize
      });

      return {
        ...prev,
        profiles: updatedProfiles
      };
    });
  };

  const moveProfileToTop = (profile: Profile) => {
    const updatedProfiles = [...settings.profiles];
    const profileIndex = updatedProfiles.findIndex(p => p.index === profile.index);

    if (profileIndex > 0) {
      const [movedProfile] = updatedProfiles.splice(profileIndex, 1);
      updatedProfiles.unshift(movedProfile);

      setSettings(prev => ({
        ...prev,
        profiles: updatedProfiles
      }));

      saveSettings({
        profiles: updatedProfiles,
        theme: settings.theme,
        language: settings.language,
        prompts: settings.prompts,
        fontSize: settings.fontSize
      });

      toast({
        // title: "Profile set as favorite",
        description: `${profile.profile_name} is now your top profile.`,
        variant: "default",
      });
    }
  };

  const handleProfileCancel = () => {
    setIsEditing(false);
    // If we were creating a new profile and canceled, reset to the first profile
    if (settings.profiles.length > 0 && !settings.profiles.find(p => p.index === activeProfile?.index)) {
      setActiveProfile(settings.profiles[0]);
    }
  };

  const handleSavePrompt = (prompt: Prompt) => {
    setSettings(prev => {
      // Check if this prompt already exists
      const existingPromptIndex = prev.prompts.findIndex(p => p.id === prompt.id);
      let updatedPrompts: Prompt[];
      
      if (existingPromptIndex >= 0) {
        // Update existing prompt
        updatedPrompts = [...prev.prompts];
        updatedPrompts[existingPromptIndex] = prompt;
      } else {
        // Add new prompt
        updatedPrompts = [...prev.prompts, prompt];
      }
      
      // Save the updated prompts to storage
      saveSettings({
        profiles: prev.profiles,
        theme: prev.theme,
        language: prev.language,
        prompts: updatedPrompts,
        fontSize: prev.fontSize
      });
      
      toast({
        description: `Prompt "${prompt.command}" has been saved.`,
        variant: "default",
      });
      
      return {
        ...prev,
        prompts: updatedPrompts
      };
    });
  };

  const handleDeletePrompt = (promptId: string) => {
    setSettings(prev => {
      // Check if we're trying to delete the last prompt
      if (prev.prompts.length <= 1) {
        toast({
          title: "Cannot delete prompt",
          description: "At least one prompt must be kept.",
          variant: "destructive",
        });
        
        // Make sure we keep the current prompt selected and visible in the UI
        // by returning the unmodified state
        return {
          ...prev,
          // Force a re-render while keeping the same prompt data
          prompts: [...prev.prompts]
        };
      }
      
      const updatedPrompts = prev.prompts.filter(p => p.id !== promptId);
      
      // Save the updated prompts to storage
      saveSettings({
        profiles: prev.profiles,
        theme: prev.theme,
        language: prev.language,
        prompts: updatedPrompts,
        fontSize: prev.fontSize
      });
      
      toast({
        description: "Prompt has been deleted.",
        variant: "default",
      });
      
      return {
        ...prev,
        prompts: updatedPrompts
      };
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <FontSizeProvider fontSize={settings.fontSize}>
      <>
        <div className="flex flex-col max-w-4xl mx-auto p-0">
          <h1 className="text-2xl font-bold my-6">Settings</h1>

          <PrivacyNotice />

          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="w-full mb-4"
            data-orientation="vertical"
          >
            <div className="flex flex-row space-x-6">
              {/* Left side tabs */}
              <TabsList className="flex flex-col h-auto w-40 space-y-2 justify-start bg-transparent">
                <TabsTrigger 
                  value="profiles" 
                  className="w-full justify-start px-4 py-2 text-left text-lg data-[state=active]:bg-gray-100 shadow-none font-normal"
                >
                  LLM API
                </TabsTrigger>
                <TabsTrigger 
                  value="prompts" 
                  className="w-full justify-start px-4 py-2 text-left text-lg data-[state=active]:bg-gray-100 shadow-none font-normal"
                >
                  Prompts
                </TabsTrigger>
                <TabsTrigger 
                  value="general" 
                  className="w-full justify-start px-4 py-2 text-left text-lg data-[state=active]:bg-gray-100 shadow-none font-normal"
                >
                  General
                </TabsTrigger>
                <TabsTrigger 
                  value="about" 
                  className="w-full justify-start px-4 py-2 text-left text-lg data-[state=active]:bg-gray-100 shadow-none font-normal"
                >
                  About
                </TabsTrigger>
              </TabsList>

              {/* Right side content */}
              <div className="flex-1">
                <TabsContent value="profiles" className="mt-0 ml-0">
                  <APIProfilesSection 
                    profiles={settings.profiles}
                    activeProfile={activeProfile}
                    isEditing={isEditing}
                    onProfileChange={setActiveProfile}
                    onAddNewProfile={addNewProfile}
                    onEditProfile={editProfile}
                    onDeleteProfile={deleteProfile}
                    onMoveToTop={moveProfileToTop}
                    onProfileFormSubmit={handleProfileFormSubmit}
                    onProfileCancel={handleProfileCancel}
                  />
                </TabsContent>

                <TabsContent value="prompts" className="mt-0 ml-0">
                  <Prompts 
                    prompts={settings.prompts}
                    onSavePrompt={handleSavePrompt}
                    onDeletePrompt={handleDeletePrompt}
                  />
                </TabsContent>

                <TabsContent value="general" className="mt-0 ml-0">
                  <LanguagePreference 
                    language={settings.language}
                    onSaveSettings={handleSaveLanguage}
                  />
                  <FontSizePreference 
                    fontSize={settings.fontSize}
                    onSaveSettings={handleSaveFontSize}
                  />
                </TabsContent>

                <TabsContent value="about" className="mt-0 ml-0">
                  <About />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>

        <Toaster />
      </>
    </FontSizeProvider>
  );
};

export default App; 