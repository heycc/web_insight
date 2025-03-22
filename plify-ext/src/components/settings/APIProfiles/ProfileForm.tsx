import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import {
  Form,
} from "../../ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "../../ui/use-toast";
import { 
  Profile, 
  ProviderType,
  profileFormSchema,
  ProfileFormValues,
  DEFAULT_PROVIDER_PRESETS
} from '../types';

import ProfileNameField from './formField/ProfileNameField';
import ProviderTypeField from './formField/ProviderTypeField';
import APIEndpointField from './formField/APIEndpointField';
import APIKeyField from './formField/APIKeyField';
import ModelNameField from './formField/ModelNameField';
import TemperatureField from './formField/TemperatureField';

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
    }
  }, [activeProfile, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mb-2">
        <ProfileNameField 
          form={form}
          isEditing={isEditing}
          selectedPresetId={selectedPresetId}
          setSelectedPresetId={setSelectedPresetId}
        />

        <ProviderTypeField 
          form={form}
          isEditing={isEditing}
          selectedPresetId={selectedPresetId}
        />

        <APIEndpointField
          form={form}
          isEditing={isEditing}
          selectedPresetId={selectedPresetId}
        />

        <APIKeyField
          form={form}
          isEditing={isEditing}
          selectedPresetId={selectedPresetId}
        />

        <ModelNameField
          form={form}
          isEditing={isEditing}
          selectedPresetId={selectedPresetId}
          activeProfile={activeProfile}
        />

        <TemperatureField
          form={form}
          isEditing={isEditing}
        />

        {isEditing && (
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