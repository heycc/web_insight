import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "../../../ui/form";
import { Input } from "../../../ui/input";
import { ProfileFormValues } from '../../types';

interface APIEndpointFieldProps {
  form: UseFormReturn<ProfileFormValues>;
  isEditing: boolean;
  selectedPresetId: string;
}

const APIEndpointField: React.FC<APIEndpointFieldProps> = ({
  form,
  isEditing,
  selectedPresetId
}) => {
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
  );
};

export default APIEndpointField; 