import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import { FontSize, FONT_SIZE_LABELS } from './types';

interface FontSizePreferenceProps {
  fontSize: FontSize;
  onSaveSettings: (fontSize: FontSize) => void;
}

const FontSizePreference: React.FC<FontSizePreferenceProps> = ({
  fontSize,
  onSaveSettings
}) => {
  const handleFontSizeChange = (value: string) => {
    // Cast the value to the appropriate type
    const typedFontSize = value as FontSize;
    // Call the parent's save function with the new font size
    onSaveSettings(typedFontSize);
  };

  return (
    <div className="mb-6">
      <div className="space-y-2">
        <div className="text-base">Font Size</div>
        <Select
          onValueChange={handleFontSizeChange}
          value={fontSize}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select font size" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FONT_SIZE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Adjust the font size for better readability.
        </p>
      </div>
    </div>
  );
};

export default FontSizePreference; 