import React, { useState } from 'react';
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
import { Button } from "../../../ui/button";
import { Eye, EyeOff, Copy } from 'lucide-react';
import { useToast } from "../../../ui/use-toast";
import { ProfileFormValues, getProviderPresetById } from '../../types';

interface APIKeyFieldProps {
  form: UseFormReturn<ProfileFormValues>;
  isEditing: boolean;
  selectedPresetId?: string;
}

const APIKeyField: React.FC<APIKeyFieldProps> = ({
  form,
  isEditing,
  selectedPresetId
}) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const { toast } = useToast();
  
  // Get the API key documentation URL if a preset is selected
  const selectedPreset = selectedPresetId ? getProviderPresetById(selectedPresetId) : undefined;
  const apiKeyDoc = selectedPreset?.api_key_doc;

  return (
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
          <FormDescription>
            {apiKeyDoc && (
              <a 
                href={apiKeyDoc} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-blue-600 hover:underline"
              >
                How to get API key from this provider?
              </a>
            )}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default APIKeyField; 