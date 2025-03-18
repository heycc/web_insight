import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Settings, Loader2, CircleStop, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { Prompt } from '../settings/types';

/**
 * Header Component for the Sidepanel
 * 
 * This component provides controls for summarizing content in the sidepanel.
 * It includes a prompt selector that loads prompts created in the Prompts.tsx component
 * from the settings/options page.
 * 
 * Unlike Prompts.tsx which handles full CRUD operations on prompts,
 * this component only focuses on selecting a prompt for immediate use in content summarization.
 * 
 * When a user selects a prompt, it passes the prompt content to the parent App component
 * which then uses it when calling the summarization function.
 */

interface HeaderProps {
  currentSite: string;
  isLoading: boolean;
  isSummarizing: boolean;
  onSummarize: (promptContent?: string) => void;
  onStopSummarization: () => void;
  onOpenSettings: () => void;
  onSelectPrompt?: (promptContent: string | undefined) => void;
}

const Header: React.FC<HeaderProps> = ({
  currentSite,
  isLoading,
  isSummarizing,
  onSummarize,
  onStopSummarization,
  onOpenSettings,
  onSelectPrompt,
}) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('default');
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Load prompts from storage
  useEffect(() => {
    const loadPrompts = async () => {
      const result = await chrome.storage.local.get(['prompts']);
      if (result.prompts && Array.isArray(result.prompts) && result.prompts.length > 0) {
        setPrompts(result.prompts);
      }
    };
    
    loadPrompts();
  }, []);

  // Get the currently selected prompt content
  const getSelectedPromptContent = (): string | undefined => {
    if (selectedPromptId === 'default') return undefined;
    const selectedPrompt = prompts.find(p => p.id === selectedPromptId);
    return selectedPrompt?.content;
  };

  // Handle prompt selection change
  const handlePromptSelect = (promptId: string) => {
    setSelectedPromptId(promptId);
    
    // Notify parent component about the prompt content change
    if (onSelectPrompt) {
      const promptContent = promptId === 'default' 
        ? undefined 
        : prompts.find(p => p.id === promptId)?.content;
      
      onSelectPrompt(promptContent);
    }
  };

  // Handle summarize button click - use the currently selected prompt
  const handleSummarize = () => {
    const promptContent = getSelectedPromptContent();
    onSummarize(promptContent);
    setPopoverOpen(false);
  };

  return (
    <div className="flex justify-between items-center mb-4 p-1">
      <h2 className="text-xl font-bold text-gradient">
        {currentSite === 'unknown' ? 'Site Not Supported' : `${currentSite} Insight`}
      </h2>
      <div className="flex items-center gap-2">
        {isSummarizing && (
          <Button
            onClick={onStopSummarization}
            variant="ghost"
            size="default"
            className="text-destructive hover:bg-primary/20 hover:text-destructive"
            title="Stop Generating"
          >
            <CircleStop className="!w-6 !h-6" />
          </Button>
        )}
        
        <div className="flex">
          <Button
            onClick={handleSummarize}
            disabled={isLoading || isSummarizing || currentSite === 'unknown'}
            className="shadow-md hover:shadow-lg transition-all rounded-r-none"
            variant="default"
            size="sm"
          >
            {isLoading || isSummarizing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isLoading ? 'Extracting' : 'Summarizing'}
              </span>
            ) : (
              selectedPromptId === 'default' ? 'Summarize' : prompts.find(p => p.id === selectedPromptId)?.command || 'Summarize'
            )}
          </Button>
          
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="default"
                size="sm"
                disabled={isLoading || isSummarizing || currentSite === 'unknown'}
                className="px-2 rounded-l-none border-l border-primary-foreground/20"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="end">
              <div className="p-2">
                <Select
                  value={selectedPromptId}
                  onValueChange={handlePromptSelect}
                >
                  <SelectTrigger className="w-full mb-2">
                    <SelectValue placeholder="Select a prompt" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    {prompts.map((prompt) => (
                      <SelectItem key={prompt.id} value={prompt.id}>
                        {prompt.command}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  className="w-full"
                  onClick={handleSummarize}
                >
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <Button
          onClick={onOpenSettings}
          variant="ghost"
          size="default"
          className="flex items-center hover:bg-primary/20 p-2"
          title="Configure LLM Provider"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Header; 