import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

interface Settings {
  extractComments: boolean;
  maxComments: number;
  theme: 'light' | 'dark' | 'system';
  autoExtract: boolean;
}

const App: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    extractComments: true,
    maxComments: 10,
    theme: 'system',
    autoExtract: false,
  });

  useEffect(() => {
    // Load settings from storage when component mounts
    const loadSettings = async () => {
      try {
        const result = await chrome.storage.sync.get('settings');
        if (result.settings) {
          setSettings(result.settings);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const saveSettings = async () => {
    try {
      await chrome.storage.sync.set({ settings });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseInt(value, 10) : value
    }));
  };

  return (
    <div className="flex flex-col max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Web Insight Settings</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Reddit Data Extraction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="extractComments"
              name="extractComments"
              checked={settings.extractComments}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="extractComments" className="text-sm font-medium">
              Extract comments
            </label>
          </div>
          
          {settings.extractComments && (
            <div className="pl-6">
              <label htmlFor="maxComments" className="block text-sm font-medium mb-1">
                Maximum comments to extract
              </label>
              <Input
                type="number"
                id="maxComments"
                name="maxComments"
                value={settings.maxComments}
                onChange={handleChange}
                min={1}
                max={100}
                className="w-24"
              />
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoExtract"
              name="autoExtract"
              checked={settings.autoExtract}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="autoExtract" className="text-sm font-medium">
              Auto-extract data when opening Reddit
            </label>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="block text-sm font-medium mb-1">Theme</label>
            <div className="flex space-x-4">
              {['light', 'dark', 'system'].map((theme) => (
                <div key={theme} className="flex items-center">
                  <input
                    type="radio"
                    id={`theme-${theme}`}
                    name="theme"
                    value={theme}
                    checked={settings.theme === theme}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label htmlFor={`theme-${theme}`} className="text-sm capitalize">
                    {theme}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Button onClick={saveSettings} className="w-full">
        Save Settings
      </Button>
    </div>
  );
};

export default App; 