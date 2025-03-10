import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Eye, EyeOff, Copy, Pencil, Plus, Trash2, ArrowUpToLine } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Toaster } from "../../components/ui/toaster";
import { useToast } from "../../components/ui/use-toast";

enum ProviderType {
  OAI_COMPATIBLE = 'oai_compatible',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GEMINI = 'gemini',
  LMSTUDIO = 'lmstudio'
}

// Add default API endpoints for each provider type
const DEFAULT_API_ENDPOINTS: Record<ProviderType, string> = {
  [ProviderType.OAI_COMPATIBLE]: '',
  [ProviderType.OPENAI]: 'https://api.openai.com/v1',
  [ProviderType.ANTHROPIC]: 'https://api.anthropic.com',
  [ProviderType.GEMINI]: 'https://generativelanguage.googleapis.com',
  [ProviderType.LMSTUDIO]: 'http://127.0.0.1:1234/v1'
};

enum ModelName {
  GPT_4 = 'gpt-4o',
  GPT_35_TURBO = 'gpt-4o-mini',
  // CLAUDE_3_OPUS = 'claude-3-opus',
  // CLAUDE_3_SONNET = 'claude-3-sonnet',
  // GEMINI_PRO = 'gemini-pro',
  DEEPSEEK_R1 = 'deepseek-r1',
  DEEPSEEK_V3 = 'deepseek-v3',
  QWEN_LONG = 'qwen-long',

}

interface Profile {
  index: number;
  profile_name: string;
  provider_type: ProviderType | string;
  api_endpoint: string;
  api_key: string;
  model_name: string;
}

interface Settings {
  profiles: Profile[];
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'zh-CN' | 'ja';
}

const DEFAULT_PROFILE: Profile = {
  index: 0,
  profile_name: 'Default Profile',
  provider_type: ProviderType.OAI_COMPATIBLE,
  api_endpoint: '',
  api_key: '',
  model_name: ''
};

// Define the form schema with Zod
const profileFormSchema = z.object({
  profile_name: z.string().min(4, "Profile name is required").max(32, "Profile name must be less than 32 characters"),
  provider_type: z.string(),
  api_endpoint: z.string().url("Please enter a valid URL"),
  api_key: z.string().min(1, "API key is required").max(100, "API key must be less than 100 characters"),
  model_name: z.string().min(1, "Model name is required").max(100, "Model name must be less than 100 characters")
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const App = () => {
  const [settings, setSettings] = useState<Settings>({
    profiles: [],
    theme: 'system',
    language: 'en',
  });

  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [customModelInput, setCustomModelInput] = useState<boolean>(false);
  const [isDeletePopoverOpen, setIsDeletePopoverOpen] = useState(false);
  const { toast } = useToast();

  // Initialize the form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      profile_name: '',
      provider_type: ProviderType.OAI_COMPATIBLE,
      api_endpoint: '',
      api_key: '',
      model_name: '',
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
      });

      // Always reset customModelInput to false when profile changes
      setCustomModelInput(false);
    }
  }, [activeProfile, form]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const result = await chrome.storage.local.get(['profiles', 'theme', 'language']);
      console.log('Loaded from storage:', result);

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
      console.error('Error loading settings:', error);
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

      console.log('Saving settings:', settingsToSave.profiles);
      await chrome.storage.local.set(settingsToSave);
      toast({
        title: "Settings saved successfully!",
        description: "Your settings have been saved.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Failed to save settings",
        description: "There was an error saving your settings. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      theme: e.target.value as 'light' | 'dark' | 'system'
    }));
  };

  const handleLanguageChange = (value: string) => {
    setSettings(prev => ({
      ...prev,
      language: value as 'en' | 'zh-CN' | 'ja'
    }));

    // Save the updated language setting immediately
    saveSettings({
      profiles: settings.profiles,
      theme: settings.theme,
      language: value as 'en' | 'zh-CN' | 'ja'
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

  const onSubmit = (data: ProfileFormValues) => {
    if (!activeProfile) return;

    const updatedProfile: Profile = {
      ...activeProfile,
      profile_name: data.profile_name,
      provider_type: data.provider_type,
      api_endpoint: data.api_endpoint,
      api_key: data.api_key,
      model_name: data.model_name
    };

    // Log the updated profile to verify model_name is being set correctly
    console.log('Updated profile before saving:', updatedProfile);

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

  const renderNoProfiles = () => {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No profiles configured. Add a profile to get started.</p>
        <Button onClick={addNewProfile} className="mx-auto">
          Add New Profile
        </Button>
      </div>
    );
  };

  const renderProfileSelector = () => {
    if (!activeProfile || isEditing) return null;

    return (
      <div className="mb-4 flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          The first profile will be used as by default. Click 'Top' to prioritize your preferred profile.
        </p>
        <div className="flex justify-between items-center mb-1">
          <div className="flex-1 mr-4">
            <Select
              onValueChange={(value: string) => {
                const selectedProfile = settings.profiles.find(p => p.index === parseInt(value));
                if (selectedProfile) {
                  setActiveProfile(selectedProfile);
                }
              }}
              value={activeProfile.index.toString()}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a profile" />
              </SelectTrigger>
              <SelectContent>
                {settings.profiles.map((profile) => (
                  <SelectItem key={profile.index} value={profile.index.toString()}>
                    {profile.profile_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-x-1 flex-shrink-0">
            {activeProfile.index !== settings.profiles[0]?.index && (
              <Button
                onClick={() => {
                  const updatedProfiles = [...settings.profiles];
                  const profileIndex = updatedProfiles.findIndex(p => p.index === activeProfile.index);

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
                      description: `${activeProfile.profile_name} is now your top profile.`,
                      variant: "default",
                    });
                  }
                }}
                size="icon"
                variant="ghost"
                title="Prioritize this profile"
              >
                <ArrowUpToLine className="h-4 w-4 text-blue-700" />
              </Button>
            )}
            <Button
              onClick={addNewProfile}
              size="icon"
              variant="ghost"
              title="Add new profile"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              onClick={editProfile}
              size="icon"
              variant="ghost"
              title="Edit profile"
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Popover open={isDeletePopoverOpen} onOpenChange={setIsDeletePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-500"
                  title="Delete profile"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4">
                <div className="space-y-2">
                  <h4 className="font-bold">Confirm Deletion</h4>
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to delete the profile?
                  </p>
                  <p className="text-sm text-blue-500">
                    {activeProfile.profile_name}
                  </p>
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsDeletePopoverOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteProfile}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    );
  };

  const renderProfileForm = () => {
    if (!activeProfile) return null;

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 mb-2">
          <FormField
            control={form.control}
            name="profile_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Name this profile"
                    {...field}
                    disabled={!isEditing}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="provider_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provider Type</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Update API endpoint with default value when provider type changes
                    if (isEditing && value in DEFAULT_API_ENDPOINTS) {
                      form.setValue('api_endpoint', DEFAULT_API_ENDPOINTS[value as ProviderType]);
                    }
                  }}
                  value={field.value}
                  disabled={!isEditing}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={ProviderType.OAI_COMPATIBLE}>OpenAI API Compatible</SelectItem>
                    <SelectItem value={ProviderType.LMSTUDIO}>LMStudio (Local)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="api_endpoint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Endpoint</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter api endpoint, usually ending with /v1"
                    {...field}
                    onChange={(e) => {
                      // Don't auto-trim trailing slashes while user is typing
                      field.onChange(e.target.value);
                    }}
                    onBlur={(e) => {
                      // Only trim trailing slashes when field loses focus
                      let value = e.target.value.trim();
                      while (value.endsWith('/')) {
                        value = value.slice(0, -1);
                      }
                      field.onChange(value);
                    }}
                    disabled={!isEditing}
                  />
                </FormControl>
                {field.value && (
                  <p className="text-sm text-muted-foreground">
                    The chat API will be {field.value}/chat/completions
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="api_key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Key</FormLabel>
                <div className="flex items-center">
                  <FormControl>
                    <Input
                      type={showApiKey ? "text" : "password"}
                      placeholder="Your API key"
                      {...field}
                      disabled={!isEditing}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-2"
                    onClick={() => {
                      navigator.clipboard.writeText(field.value)
                        .then(() => {
                          toast({
                            title: "Copied!",
                            description: "API key copied to clipboard",
                            variant: "default",
                          });
                        })
                        .catch(() => {
                          toast({
                            title: "Failed to copy",
                            description: "Could not copy API key to clipboard",
                            variant: "destructive",
                          });
                        });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-2"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model Name</FormLabel>
                {!isEditing && (
                  <div className="flex items-center">
                    <div className="flex-grow">
                      <FormControl>
                        <Input
                          value={field.value || ''}
                          disabled={true}
                        />
                      </FormControl>
                    </div>
                  </div>
                )}
                {isEditing && customModelInput && (
                  <div className="flex items-center">
                    <div className="flex-grow">
                      <FormControl>
                        <Input
                          placeholder="Enter custom model name"
                          value={field.value || ''}
                          onChange={field.onChange}
                          disabled={false}
                        />
                      </FormControl>
                    </div>
                    <div className="flex ml-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className='text-red-500'
                        onClick={() => {
                          setCustomModelInput(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (field.value && field.value.trim() !== '') {
                            setCustomModelInput(false);
                            toast({
                              title: "Custom model added",
                              description: `Added "${field.value}" to model selection`,
                              variant: "default",
                            });
                          } else {
                            toast({
                              title: "Invalid model name",
                              description: "Please enter a valid model name",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        OK
                      </Button>
                    </div>
                  </div>
                )}
                {isEditing && !customModelInput && (
                  <div className="flex items-center">
                    <div className="flex-grow">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                        disabled={false}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select model, or click to add custom model 👉" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ModelName).map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                          {field.value && !Object.values(ModelName).includes(field.value as ModelName) && (
                            <SelectItem key={field.value} value={field.value}>
                              {field.value}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="ml-2"
                      onClick={() => setCustomModelInput(true)}
                    >
                      <span className="text-xl">+</span>
                    </Button>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {isEditing && !customModelInput && (
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  // If we were creating a new profile and canceled, reset to the first profile
                  if (settings.profiles.length > 0 && !settings.profiles.find(p => p.index === activeProfile?.index)) {
                    setActiveProfile(settings.profiles[0]);
                  }
                }}
                variant="outline"
                className="text-red-500"
              >
                Cancel
              </Button>
              <Button type="submit">
                Save Profile
              </Button>
            </div>
          )}
        </form>
      </Form>
    );
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
      <div className="flex flex-col max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Web Insight Settings</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>API Profiles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Case 1: No profiles configured */}
            {settings.profiles.length === 0 && !isEditing && renderNoProfiles()}

            {/* Case 2: Has profiles and not editing */}
            {settings.profiles.length > 0 && !isEditing && (
              <>
                {renderProfileSelector()}
                {activeProfile && renderProfileForm()}
              </>
            )}

            {/* Case 3: Is editing (either existing profile or new profile) */}
            {isEditing && renderProfileForm()}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="font-medium">Language</div>
              <Select
                onValueChange={handleLanguageChange}
                value={settings.language}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh-CN">简体中文 (Simplified Chinese)</SelectItem>
                  <SelectItem value="ja">日本語 (Japanese)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Preferred language for the response.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </>
  );
};

export default App; 