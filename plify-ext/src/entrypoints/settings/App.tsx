import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Toaster } from "../../components/ui/toaster";
import { useToast } from "../../components/ui/use-toast";

import { createLogger } from "../../lib/utils";
import { 
  APIProfilesSection, 
  LanguagePreference, 
  PrivacyNotice 
} from '../../components/settings';
import { 
  Profile,
  Settings,
  ProviderType,
  Language
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

// Define the form schema with Zod
const profileFormSchema = z.object({
  profile_name: z.string().min(4, "Profile name is required").max(32, "Profile name must be less than 32 characters"),
  provider_type: z.string(),
  api_endpoint: z.string().url("Please enter a valid URL"),
  api_key: z.string().min(1, "API key is required").max(100, "API key must be less than 100 characters"),
  model_name: z.string().min(1, "Model name is required").max(100, "Model name must be less than 100 characters"),
  temperature: z.number().min(0.1, "Temperature must be at least 0.1").max(1.5, "Temperature must be at most 1.5")
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const App = () => {
  const [settings, setSettings] = useState<Settings>({
    profiles: [],
    theme: 'system',
    language: Language.EN,
  });

  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [customModelInput, setCustomModelInput] = useState<boolean>(false);
  const [isDeletePopoverOpen, setIsDeletePopoverOpen] = useState(false);
  const { toast } = useToast();
  const logger = createLogger('Settings');

  // Initialize the form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      profile_name: '',
      provider_type: ProviderType.OAI_COMPATIBLE,
      api_endpoint: '',
      api_key: '',
      model_name: '',
      temperature: 0.6,
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  // Reset form when active profile changes
  useEffect(() => {
    if (activeProfile) {
      form.reset({
        profile_name: activeProfile.profile_name,
        provider_type: activeProfile.provider_type,
        api_endpoint: activeProfile.api_endpoint,
        api_key: activeProfile.api_key,
        model_name: activeProfile.model_name || '',
        temperature: activeProfile.temperature ?? 0.6,
      });

      // Always reset customModelInput to false when profile changes
      setCustomModelInput(false);
    }
  }, [activeProfile, form]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const result = await chrome.storage.local.get(['profiles', 'theme', 'language']);
      logger.log('Loaded from storage:', result);

      if (result.profiles && result.profiles.length > 0) {
        // Ensure model_name is properly set for each profile
        const validatedProfiles = result.profiles.map((profile: Profile) => ({
          ...profile,
          model_name: profile.model_name || '' // Ensure model_name is never undefined
        }));

        setSettings({
          profiles: validatedProfiles,
          theme: result.theme || 'system',
          language: result.language || 'en'
        });
        // Set the first profile as active
        setActiveProfile(validatedProfiles[0]);
      } else {
        // No profiles found
        setSettings({
          profiles: [],
          theme: result.theme || 'system',
          language: result.language || 'en'
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
        language: settings.language
      };

      logger.log('Saving settings:', settingsToSave.profiles);
      await chrome.storage.local.set(settingsToSave);
      toast({
        title: "Settings saved successfully!",
        description: "Your settings have been saved.",
        variant: "default",
      });
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
      language: newLanguage
    });
  };

  const addNewProfile = () => {
    const newProfile: Profile = {
      ...DEFAULT_PROFILE,
      index: settings.profiles.length,
      profile_name: `Profile ${settings.profiles.length + 1}`,
    };

    setActiveProfile(newProfile);
    setIsEditing(true);
    setCustomModelInput(false);
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
      language: settings.language
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
        language: prev.language
      });

      return {
        ...prev,
        profiles: updatedProfiles
      };
    });

    // Close the popover after deletion
    setIsDeletePopoverOpen(false);
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
        language: settings.language
      });

      toast({
        title: "Profile set as favorite",
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col max-w-3xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <PrivacyNotice />

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

        <LanguagePreference 
          language={settings.language}
          onSaveSettings={handleSaveLanguage}
        />
      </div>
      <Toaster />
    </>
  );
};

export default App; 