import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Eye, EyeOff, Copy, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "../../ui/form";
import { Slider } from "../../ui/slider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "../../ui/use-toast";
import { 
  Profile, 
  ProviderType,
  DEFAULT_API_ENDPOINTS,
  profileFormSchema,
  ProfileFormValues,
  DEFAULT_PROVIDER_PRESETS
} from '../types';
import ProfileNameField from './formField/ProfileNameField';

interface ProfileFormProps {
  activeProfile: Profile | null;
  isEditing: boolean;
  onSubmit: (data: ProfileFormValues) => void;
  onCancel: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  activeProfile,
  isEditing,
  onSubmit,
  onCancel
}) => {
  // Early return if no active profile
  if (!activeProfile) return null;

  const [showApiKey, setShowApiKey] = useState(false);
  const [customModelInput, setCustomModelInput] = useState<boolean>(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const { toast } = useToast();

  // Initialize the form. The 'activeProfile' is the profile (state) that is currently selected in parent component.
  // If 'activeProfile' is null, it means that user is creating a new profile.
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      profile_name: activeProfile?.profile_name || '',
      provider_type: activeProfile?.provider_type || ProviderType.OAI_COMPATIBLE,
      api_endpoint: activeProfile?.api_endpoint || '',
      api_key: activeProfile?.api_key || '',
      model_name: activeProfile?.model_name || '',
      temperature: activeProfile?.temperature ?? 0.6,
    }
  });

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

      // Find if this profile matches any preset. Use the profile name to find the matching preset.
      const matchingPreset = DEFAULT_PROVIDER_PRESETS.find(
        preset => 
          preset.display_name === activeProfile.profile_name
      );
      
      if (matchingPreset) {
        setSelectedPresetId(matchingPreset.id);
      } else {
        // If no matching preset, set selectedPresetId to empty string to indicate custom profile
        setSelectedPresetId('');
      }
      
      // Always reset customModelInput to false when profile changes
      setCustomModelInput(false);
    }
  }, [activeProfile, form]);
  
  // Function to normalize the API endpoint URL
  const normalizeApiEndpoint = (url: string): string => {
    let normalizedUrl = url.trim();
    
    // Remove trailing slashes
    while (normalizedUrl.endsWith('/')) {
      normalizedUrl = normalizedUrl.slice(0, -1);
    }
    
    // Remove '/chat/completions' if it's at the end of the URL
    if (normalizedUrl.endsWith('/chat/completions')) {
      normalizedUrl = normalizedUrl.slice(0, -17);
    }
    
    return normalizedUrl;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mb-2">
        <ProfileNameField 
          form={form}
          isEditing={isEditing}
          selectedPresetId={selectedPresetId}
          setSelectedPresetId={setSelectedPresetId}
        />

        <FormField
          control={form.control}
          name="provider_type"
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <FormLabel className="text-base font-normal">Provider Type</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  // Update API endpoint with default value when provider type changes
                  if (isEditing && value in DEFAULT_API_ENDPOINTS) {
                    form.setValue('api_endpoint', DEFAULT_API_ENDPOINTS[value as ProviderType]);
                  }
                }}
                value={field.value}
                disabled={!isEditing || !!selectedPresetId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider type" />
                  </SelectTrigger>
                </FormControl>
                {/* TODO: 这里写死了 type 列表，应该从 types.tsx 中获取 */}
                <SelectContent>
                  <SelectItem value={ProviderType.OAI_COMPATIBLE}>OpenAI API Compatible</SelectItem>
                  <SelectItem value={ProviderType.OPENAI}>OpenAI</SelectItem>
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
            <FormItem className='space-y-1'>
              <FormLabel className="text-base font-normal">API Endpoint</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter api endpoint"
                  {...field}
                  onChange={(e) => {
                    // Don't auto-trim trailing slashes while user is typing
                    field.onChange(e.target.value);
                  }}
                  onBlur={(e) => {
                    // Use the normalization function when field loses focus
                    field.onChange(normalizeApiEndpoint(e.target.value));
                  }}
                  disabled={!isEditing || !!selectedPresetId}
                />
              </FormControl>
              {field.value ? (
                <FormDescription>
                  The chat API will be {field.value}/chat/completions
                </FormDescription>
              ) : (
                <FormDescription>
                  API typically like https://api.openai.com/v1
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="api_key"
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <FormLabel className="text-base font-normal">API Key</FormLabel>
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
            <FormItem className='space-y-1'>
              <FormLabel className="text-base font-normal">Model Name</FormLabel>
              {!isEditing && (
                <div className="flex items-center">
                  <div className="flex-grow">
                    <FormControl>
                      <Input
                        value={field.value}
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
                      value={field.value}
                      disabled={false}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select model, or click to add custom model 👉" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedPresetId && DEFAULT_PROVIDER_PRESETS.find(preset => preset.id === selectedPresetId)?.models.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                        {/* {!selectedPresetId && Object.values(ModelName).map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))} */}
                        {/* Always include the current field value as an option if it has a value */}
                        {field.value && !(
                          (selectedPresetId && DEFAULT_PROVIDER_PRESETS.find(preset => preset.id === selectedPresetId)?.models.includes(field.value))
                        ) && (
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
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="temperature"
          render={({ field }) => (
            <FormItem className='space-y-0'>
              <FormLabel className="text-base font-normal">Temperature</FormLabel>
              <div className="flex items-center space-x-4">
                <FormControl>
                  <Slider
                    min={0.1}
                    max={1.5}
                    step={0.1}
                    value={[field.value]}
                    onValueChange={(values: number[]) => {
                      field.onChange(values[0]);
                    }}
                    disabled={!isEditing}
                    className="flex-grow bg-gray-100"
                  />
                </FormControl>
                <FormControl>
                  <Input
                    type="number"
                    min={0.1}
                    max={1.5}
                    step={0.1}
                    value={field.value}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        // Clamp value between 0.1 and 1.5
                        const clampedValue = Math.min(Math.max(value, 0.1), 1.5);
                        field.onChange(clampedValue);
                      }
                    }}
                    disabled={!isEditing}
                    className="w-16 text-center"
                  />
                </FormControl>
              </div>
              <FormDescription>
                Controls randomness, lower values are more deterministic, range [0.1, 1.5]
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {isEditing && !customModelInput && (
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              type="button"
              onClick={onCancel}
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

export default ProfileForm; 