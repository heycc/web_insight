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
import { useToast } from "../../../ui/use-toast";
import { ProfileFormValues, DEFAULT_PROVIDER_PRESETS } from '../../types';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "../../../ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../ui/popover";
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from "../../../../lib/utils";

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
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value || "Select model, or click to add custom model 👉"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command className="w-full">
                      <CommandInput placeholder="Search model..." />
                      <CommandEmpty>No model found.</CommandEmpty>
                      <CommandGroup className="max-h-[400px] overflow-y-auto scrollbar-visible">
                        {selectedPresetId && DEFAULT_PROVIDER_PRESETS.find(preset => preset.id === selectedPresetId)?.models.map((model) => (
                          <CommandItem
                            key={model}
                            value={model}
                            onSelect={() => {
                              field.onChange(model);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === model ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {model}
                          </CommandItem>
                        ))}
                        {/* Always include the current field value as an option if it has a value */}
                        {field.value && !(
                          (selectedPresetId && DEFAULT_PROVIDER_PRESETS.find(preset => preset.id === selectedPresetId)?.models.includes(field.value))
                        ) && (
                          <CommandItem
                            key={field.value}
                            value={field.value}
                            onSelect={() => {
                              field.onChange(field.value);
                            }}
                          >
                            <Check className="mr-2 h-4 w-4 opacity-100" />
                            {field.value}
                          </CommandItem>
                        )}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
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