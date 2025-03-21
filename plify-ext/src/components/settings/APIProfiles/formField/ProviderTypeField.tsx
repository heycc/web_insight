import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "../../../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../../ui/select";
import { ProfileFormValues, ProviderType, DEFAULT_API_ENDPOINTS } from '../../types';

interface ProviderTypeFieldProps {
  form: UseFormReturn<ProfileFormValues>;
  isEditing: boolean;
  selectedPresetId: string;
}

const ProviderTypeField: React.FC<ProviderTypeFieldProps> = ({
  form,
  isEditing,
  selectedPresetId
}) => {
  return (
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
  );
};

export default ProviderTypeField; 