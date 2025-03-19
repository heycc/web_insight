import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Settings, Loader2, CircleStop, Send } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../ui/select";
import { Prompt } from '../settings/types';
import { cn } from '@/lib/utils';

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
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [loadError, setLoadError] = useState<boolean>(false);
  // Add a ref to track if we've done the initial prompt selection
  const initializedRef = useRef(false);

  // Load prompts from storage
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        const result = await chrome.storage.local.get(['prompts']);
        if (result.prompts && Array.isArray(result.prompts) && result.prompts.length > 0) {
          setPrompts(result.prompts);
          setSelectedPromptId(result.prompts[0].id);

          // Initialize with the first prompt - only if we haven't already
          if (onSelectPrompt && !initializedRef.current) {
            onSelectPrompt(result.prompts[0].content);
            initializedRef.current = true;
          }
        } else {
          setLoadError(true);
        }
      } catch (error) {
        console.error("Error loading prompts:", error);
        setLoadError(true);
      }
    };

    loadPrompts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get the currently selected prompt content
  const getSelectedPromptContent = (): string | undefined => {
    const selectedPrompt = prompts.find(p => p.id === selectedPromptId);
    return selectedPrompt?.content;
  };

  // Handle prompt selection change
  const handlePromptSelect = (promptId: string) => {
    setSelectedPromptId(promptId);

    // Notify parent component about the prompt content change
    if (onSelectPrompt) {
      const promptContent = prompts.find(p => p.id === promptId)?.content;
      onSelectPrompt(promptContent);
    }
  };

  // Handle summarize button click - use the currently selected prompt
  const handleSummarize = () => {
    const promptContent = getSelectedPromptContent();
    onSummarize(promptContent);
  };

  return (
    <div className="flex justify-between items-center p-2">
      {/* Error message when no prompts are found */}
      {loadError && (
        <div className="text-sm text-destructive p-1 ml-2">
          No prompts found. Please add one in settings.
        </div>
      )}

      {/* Left side: Action buttons and prompt selector */}
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {/* Main action button */}
          <Button
            onClick={handleSummarize}
            disabled={isLoading || isSummarizing || currentSite === 'unknown' || loadError || prompts.length === 0}
            className={cn(
              "shadow-md hover:shadow-lg transition-all",
              "rounded-l-[18px] rounded-r-[2px] border-none",
              "text-primary-foreground",
              "py-0 pr-2 pl-2 h-9"
            )}
            variant="default"
            size="sm"
          >
            {isLoading || isSummarizing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {/* Loading indicator */}
              </span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {/* Display command name with truncation if needed */}
                {(() => {
                  const command = prompts.find(p => p.id === selectedPromptId)?.command || 'Summarize';
                  return command.length > 16 ? command.substring(0, 16) + '...' : command;
                })()}
              </>
            )}
          </Button>
          <Select
            value={selectedPromptId}
            onValueChange={(value) => {
              handlePromptSelect(value);
              // Blur the select element to remove focus after selection
              document.activeElement instanceof HTMLElement && document.activeElement.blur();
            }}
            disabled={isLoading || isSummarizing || loadError || prompts.length === 0}
          >
            <SelectTrigger
              className={cn(
                "shadow-md hover:shadow-lg transition-all",
                "rounded-r-[18px] rounded-l-[2px] border-none",
                "w-8 h-9 py-0 pl-1 pr-0",
                "bg-primary text-primary-foreground",
                "focus:ring-0 focus:ring-offset-0",
                "[&>svg]:text-primary-foreground [&>svg]:opacity-100"
              )}
            >
            </SelectTrigger>
            <SelectContent>
              {prompts.length > 0 ? (
                prompts.map((prompt) => (
                  <SelectItem key={prompt.id} value={prompt.id}>
                    {prompt.command}
                  </SelectItem>
                ))
              ) : (
                <div className="px-1 py-1 text-sm text-muted-foreground text-center">
                  No prompts available. Add prompts in ⛭.
                </div>
              )}
              <div className="px-2 py-1 text-xs text-muted-foreground mt-1 text-center">
                Customize prompts in ⛭
              </div>
            </SelectContent>
          </Select>

        </div>

        {/* Stop button - only shown during summarization */}
        {isSummarizing && (
          <div className="flex justify-center">
            <Button
              onClick={onStopSummarization}
              variant="ghost"
              size="default"
              className=" h-9 px-2 rounded-full text-destructive hover:text-destructive border-destructive"
              title="Stop Generating"
            >
              <CircleStop className="!w-6 !h-6" />
              Stop
            </Button>
          </div>
        )}
      </div>

      {/* Right side: Site title and settings button */}
      <div className="flex items-center">
        <h2 className="text-lg font-bold text-gradient">
          {currentSite === 'unknown' ? 'Site Not Supported' : `${currentSite} Insight`}
        </h2>
        <Button
          onClick={onOpenSettings}
          variant="ghost"
          size="default"
          className="flex items-center hover:bg-primary/20 py-0 px-2 h-9"
          title="Configure LLM Provider"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Header; 