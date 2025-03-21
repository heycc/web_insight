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
import { Slider } from "../../../ui/slider";
import { ProfileFormValues } from '../../types';

interface TemperatureFieldProps {
  form: UseFormReturn<ProfileFormValues>;
  isEditing: boolean;
}

const TemperatureField: React.FC<TemperatureFieldProps> = ({
  form,
  isEditing
}) => {
  return (
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
  );
};

export default TemperatureField; 