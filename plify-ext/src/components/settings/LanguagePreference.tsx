import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Language, LANGUAGE_LABELS } from './types';

interface LanguagePreferenceProps {
  language: Language;
  onSaveSettings: (language: Language) => void;
}

const LanguagePreference: React.FC<LanguagePreferenceProps> = ({
  language,
  onSaveSettings
}) => {
  const handleLanguageChange = (value: string) => {
    // Cast the value to the appropriate type
    const typedLanguage = value as Language;
    
    // Call the parent's save function with the new language
    onSaveSettings(typedLanguage);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="font-medium">Language</div>
          <Select
            onValueChange={handleLanguageChange}
            value={language}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Preferred language for the response.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LanguagePreference; 