import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "../../../ui/form";
import { Input } from "../../../ui/input";
import { Button } from "../../../ui/button";
import { Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../../ui/select";
import { useToast } from "../../../ui/use-toast";
import { ProfileFormValues, DEFAULT_PROVIDER_PRESETS } from '../../types';

interface ModelNameFieldProps {
  form: UseFormReturn<ProfileFormValues>;
  isEditing: boolean;
  selectedPresetId: string;
  activeProfile: ProfileFormValues | null;
}

const ModelNameField: React.FC<ModelNameFieldProps> = ({
  form,
  isEditing,
  selectedPresetId,
  activeProfile
}) => {
  const [customModelInput, setCustomModelInput] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Reset customModelInput to false when active profile changes
  useEffect(() => {
    setCustomModelInput(false);
  }, [activeProfile]);

  return (
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
  );
};

export default ModelNameField; 