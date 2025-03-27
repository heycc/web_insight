import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import {
  Loader2,
  ExternalLink
} from 'lucide-react';
import { SummaryService } from '../../lib/summary';
import { useToast } from "../../components/ui/use-toast";
import { Toaster } from "../../components/ui/toaster";
import { ContentServiceFactory, ContentService, ContentData } from '../../lib/content-service';
import SummaryView from '../../components/sidepanel/SummaryView';
import ContentDataView from '../../components/sidepanel/ContentDataView';
import WelcomeMessage from '../../components/sidepanel/WelcomeMessage';
import Header from '../../components/sidepanel/Header';
import { createLogger } from '../../lib/utils';
import { FontSizeProvider } from '../../components/settings';
import { FontSize } from '../../components/settings/types';

// Add global handler for AbortError from stream aborts
// This prevents the error from showing in the console
window.addEventListener('unhandledrejection', (event) => {
  // Only suppress AbortErrors from our code
  if (event.reason?.name === 'AbortError' &&
    event.reason?.message === 'BodyStreamBuffer was aborted' &&
    event.reason?.stack?.includes('SummaryService.abortStream')) {
    // Prevent the error from showing in the console
    event.preventDefault();
    console.log('Suppressed expected AbortError from stream cancellation');
  }
});

const App: React.FC = () => {
  // Create a logger for the sidepanel
  const logger = createLogger('Sidepanel');

  const [contentData, setContentData] = useState<ContentData | null>(null);
  const [currentSite, setCurrentSite] = useState<string>('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [reasoning, setReasoning] = useState<string>('');
  const [showReasoning, setShowReasoning] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [copiedState, setCopiedState] = useState<{ summary: boolean, withReasoning: boolean }>({
    summary: false,
    withReasoning: false
  });
  // Add state for header shadow
  const [hasScrolled, setHasScrolled] = useState(false);
  // Store the content of the currently selected prompt
  const [currentPromptContent, setCurrentPromptContent] = useState<string | undefined>(undefined);
  // Add state to track if API profiles are configured
  const [hasApiProfiles, setHasApiProfiles] = useState<boolean>(true);
  // Add state for font size setting
  const [fontSize, setFontSize] = useState<FontSize>(FontSize.MEDIUM);
  
  const { toast } = useToast();

  // Create a single shared instance of SummaryService
  const summaryServiceRef = useRef(new SummaryService());
  // Create a ref for the content service
  const contentServiceRef = useRef<ContentService | null>(null);
  // Add ref for reasoning container
  const reasoningContainerRef = useRef<HTMLDivElement>(null);
  // Track if user has manually scrolled up
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  const summaryService = summaryServiceRef.current;

  const [resultTab, setResultTab] = useState('summary');

  // Helper function to check and reinitialize content service if needed
  const ensureCorrectContentService = async (): Promise<boolean> => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs || tabs.length === 0) return false;

      const url = tabs[0].url || '';

      // If no content service exists, initialize it
      if (!contentServiceRef.current) {
        logger.log('No content service, initializing...');
        const service = await ContentServiceFactory.createService(summaryService);
        contentServiceRef.current = service;
        setCurrentSite(service.getSiteName());
        return true;
      }

      // Always update current site to match the content service
      const currentSiteLower = contentServiceRef.current.getSiteName().toLowerCase();
      setCurrentSite(contentServiceRef.current.getSiteName());

      let needsReinitialization = false;
      if (url.includes('reddit.com') && currentSiteLower !== 'reddit') {
        needsReinitialization = true;
      } else if (url.includes('youtube.com') && currentSiteLower !== 'youtube') {
        needsReinitialization = true;
      }

      // Reinitialize if needed
      if (needsReinitialization) {
        const service = await ContentServiceFactory.createService(summaryService);
        contentServiceRef.current = service;
        setCurrentSite(service.getSiteName());
        logger.log('Site changed, reinitializing content service...', service.getSiteName());
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error checking content service:', error);
      return false;
    }
  };

  // Initialize the content service
  useEffect(() => {
    const initContentService = async () => {
      try {
        // First check if profiles are configured using the SummaryService
        const hasProfiles = await summaryService.hasApiProfiles();
        setHasApiProfiles(hasProfiles);
        
        // Disable this check when initializing, because the wellcome message will show
        // if (!hasProfiles) {
        //   setError('No LLM API found. Please add an API profile in settings.');
        //   return;
        // }
        
        await ensureCorrectContentService();
      } catch (error) {
        logger.error('Error initializing content service:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize content service');
      }
    };

    // Initialize content service on component mount
    initContentService();

    // Register for profile changes
    const unsubscribe = summaryService.addProfileListener((hasProfiles) => {
      setHasApiProfiles(hasProfiles);
      if (hasProfiles) {
        // Clear error if it was about missing profiles
        if (error && error.includes('No API profiles configured')) {
          setError(null);
        }
        // Reinitialize content service since profiles are now available
        ensureCorrectContentService();
      } else {
        setError('No API profiles configured. Please configure an API profile in settings.');
      }
    });

    // Listen for tab updates (URL changes)
    const handleTabUpdated = async (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      // Only process if URL changed and tab is active
      if (changeInfo.url && tab.active) {
        logger.log(`Tab URL changed to: ${changeInfo.url}`);
        await ensureCorrectContentService();
      }
    };

    // Listen for tab activation changes
    const handleTabActivated = async (activeInfo: chrome.tabs.TabActiveInfo) => {
      logger.log(`Tab activated: ${activeInfo.tabId}`);
      // Always reinitialize content service when tab activation changes
      const service = await ContentServiceFactory.createService(summaryService);
      logger.log('Tab changed, reinitializing content service...', service.getSiteName());
      contentServiceRef.current = service;
      setCurrentSite(service.getSiteName());
      
    };

    // Add event listeners
    chrome.tabs.onUpdated.addListener(handleTabUpdated);
    chrome.tabs.onActivated.addListener(handleTabActivated);

    // Clean up event listeners on unmount
    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabUpdated);
      chrome.tabs.onActivated.removeListener(handleTabActivated);
      unsubscribe(); // Clean up profile listener
    };
  }, []);

  // Load font size setting
  useEffect(() => {
    const loadFontSizeSetting = async () => {
      try {
        const result = await chrome.storage.local.get(['fontSize']);
        if (result.fontSize) {
          setFontSize(result.fontSize);
        }
      } catch (error) {
        logger.error('Error loading font size setting:', error);
      }
    };

    loadFontSizeSetting();

    // Listen for font size changes from settings
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes.fontSize) {
        setFontSize(changes.fontSize.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  const extractContentData = async () => {
    if (!contentServiceRef.current) {
      setError('Content service not initialized');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Ensure we have the correct content service for the current site
      await ensureCorrectContentService();

      const data = await contentServiceRef.current.extractData();
      setContentData(data);

      return data;
    } catch (err) {
      logger.error(`Error extracting ${currentSite} data:`, err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle prompt selection from the Header UI component
  const handleSelectPrompt = (promptContent: string | undefined) => {
    // Store the selected prompt content for use in summarization
    setCurrentPromptContent(promptContent);
    logger.log('Selected prompt content updated:', promptContent ? 'custom prompt' : 'default');
  };

  const summarizeContentData = async (data: ContentData | null = null, customPrompt?: string) => {
    if (!contentServiceRef.current) {
      setError('Content service not initialized');
      return;
    }

    const dataToSummarize = data || contentData;

    if (!dataToSummarize) {
      const errorMessage = `No ${currentSite} data to summarize. Please extract data first.`;
      setError(errorMessage);
      return;
    }

    setIsSummarizing(true);
    setError(null);
    setSummary('');
    setReasoning('');

    try {
      let fullSummary = '';
      let fullReasoning = '';
      let aborted = false;

      // Use the streaming API to get the summary in chunks
      try {
        // Log to confirm we're starting the stream
        logger.log('Starting summarization stream...');

        let reasoningStarted = false;
        let contentStarted = false;
        // let reasoningFolded = false;

        for await (const chunk of contentServiceRef.current.summarizeData(dataToSummarize, customPrompt)) {
          if (chunk.type === 'reasoning') {
            // Remove problematic code fences
            // const processedText = chunk.text
            //   .replace(/^```\s*$/gm, '')  // Remove empty code fence
            //   .replace(/^```(\s*)$/gm, ''); // Remove code fence with whitespace
            
            fullReasoning += chunk.text;
            setReasoning(fullReasoning);
            // Only unfold reasoning when first chunk arrives
            if (!reasoningStarted) {
              setShowReasoning(true);
              reasoningStarted = true;
            }
          }
          if (chunk.type === 'content') {
            // Remove problematic code fences
            // const processedText = chunk.text
            //   .replace(/^```\s*$/gm, '')  // Remove empty code fence
            //   .replace(/^```(\s*)$/gm, ''); // Remove code fence with whitespace
            
            fullSummary += chunk.text;
            setSummary(fullSummary);
            // Only fold reasoning when first chunk arrives and there is reasoning section
            // Because some model don't generate reasoning content, or generate it in the content section
            if (!contentStarted && reasoningStarted) {
              setShowReasoning(false);
              // reasoningFolded = true;
              contentStarted = true;
            }
          }
          // console.log('DEBUG, showReasoning:', showReasoning)
        }
      } catch (err) {
        logger.log('Caught error during summarization:', err);

        // Check if this was an abort error
        if (err instanceof Error && err.name === 'AbortError') {
          logger.log('Confirmed abort error');
          aborted = true;
        } else if (isSummarizing) {
          // If we're still in summarizing state, assume it was an abort
          logger.log('Assuming abort based on state');
          aborted = true;
        } else {
          // Re-throw if it wasn't an abort
          throw err;
        }
      }

      // Add a note if the summary was aborted
      if (aborted && fullSummary) {
        fullSummary += '\n\n*Summarization was stopped by user*';
        setSummary(fullSummary);
      }
    } catch (err) {
      logger.error('Error summarizing data:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during summarization';
      setError(errorMessage);
    } finally {
      logger.log('Summarization finished (finally block)');
      setIsSummarizing(false);
    }
  };

  // Handle summarize button click with optional custom prompt content
  const handleSummarize = async (promptContent?: string) => {
    // Use either the provided prompt content or the one stored in state
    const promptToUse = promptContent !== undefined ? promptContent : currentPromptContent;
    
    // First extract data, then summarize
    setIsLoading(true);
    const extractedData = await extractContentData();
    if (extractedData) {
      await summarizeContentData(extractedData, promptToUse);
    }
  };

  // Regenerate the summary using the stored prompt content
  const handleRegenerate = async () => {
    // Use the stored prompt content when regenerating
    await handleSummarize(currentPromptContent);
  };

  const handleCopySummary = (includeReasoning: boolean = false) => {
    if (summary) {
      let textToCopy = summary;

      if (includeReasoning && reasoning) {
        textToCopy = `## Model Reasoning\n${reasoning}\n\n## Summary\n${summary}`;
      }

      navigator.clipboard.writeText(textToCopy);

      if (includeReasoning) {
        setCopiedState({ summary: false, withReasoning: true });
      } else {
        setCopiedState({ summary: true, withReasoning: false });
      }

      setTimeout(() => {
        setCopiedState({ summary: false, withReasoning: false });
      }, 1500);
    }
  };

  const handleStopSummarization = () => {
    if (isSummarizing && contentServiceRef.current) {
      logger.log('User stopping summarization...');
      try {
        contentServiceRef.current.stopSummarization();
      } catch (error) {
        // Silently catch the AbortError - this is expected
        logger.log('Abort operation completed with expected abort error');
      }
      // We don't immediately set isSummarizing to false here
      // Let the summarizeContentData catch block handle it
    }
  };

  // Auto-scroll reasoning to bottom when content updates
  useEffect(() => {
    if (reasoning && showReasoning && reasoningContainerRef.current && !userScrolledUp) {
      const container = reasoningContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [reasoning, showReasoning, userScrolledUp]);

  // Reset userScrolledUp when reasoning is toggled
  useEffect(() => {
    if (showReasoning) {
      setUserScrolledUp(false);
    }
  }, [showReasoning]);

  // Add scroll event listener to apply shadow when scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setHasScrolled(true);
      } else {
        setHasScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <FontSizeProvider fontSize={fontSize}>
      <div className="flex flex-col h-full max-w-4xl mx-auto p-0 mt-1 bg-background">
        <Toaster />
        <div className={`sticky top-0 z-10 bg-background transition-shadow duration-200 ${hasScrolled ? 'shadow-md' : ''}`}>
          <Header 
            currentSite={currentSite}
            isLoading={isLoading}
            isSummarizing={isSummarizing}
            onSummarize={handleSummarize}
            onStopSummarization={handleStopSummarization}
            onOpenSettings={openSettings}
            onSelectPrompt={handleSelectPrompt}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 mb-2 bg-destructive/10 text-destructive rounded-md shadow-sm break-words">
            {error}
          </div>
        )}

        {/* Welcome message on first load */}
        {!summary && !contentData && (
          <WelcomeMessage 
            currentSite={currentSite} 
            hasApiProfiles={hasApiProfiles} 
            onOpenSettings={openSettings}
          />
        )}

        {/* Summary or content data */}
        {(summary || contentData) && (
          <>
            {contentData && (
              <div className="mb-2 mx-4 flex flex-row gap-2">
                <h3 className="text-lg font-semibold hover:underline">
                  <a href={contentData.url || ''} target="_blank" rel="noopener noreferrer">
                    {contentData.title || 'Untitled Post'}
                    <ExternalLink className="h-4 w-4 text-blue-500 ml-4 inline" />
                  </a>
                </h3>
              </div>
            )}
            <Tabs value={resultTab} onValueChange={setResultTab} className="w-full">
              <TabsList className="grid grid-cols-2 mx-auto bg-secondary mx-2">
                <TabsTrigger value="summary" className="px-3 py-1 rounded-full font-semibold hover:bg-primary/20 hover:text-accent-foreground">✨ Summary</TabsTrigger>
                <TabsTrigger value="data" className="px-3 py-1 rounded-full font-semibold hover:bg-primary/20 hover:text-accent-foreground">📄 Content</TabsTrigger>
              </TabsList>

              <TabsContent value="summary">
                {(isLoading || isSummarizing) && !(summary || reasoning) && (
                  <div className="p-6 flex flex-col items-center justify-center text-center text-muted-foreground bg-card rounded-lg">
                    <div className="mb-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </div>
                    <p className="mb-2 font-medium">
                      {isLoading ? 'Extracting content...' : 'Generating summary...'}
                    </p>
                    <p className="text-sm">
                      {isLoading ? 'Analyzing the page content' : 'Waiting for the first token'}
                    </p>
                  </div>
                )}
                {(summary || reasoning) && (
                  <SummaryView
                    summary={summary}
                    reasoning={reasoning}
                    showReasoning={showReasoning}
                    isSummarizing={isSummarizing}
                    isLoading={isLoading}
                    copiedState={copiedState}
                    onToggleReasoning={() => setShowReasoning(!showReasoning)}
                    onCopy={handleCopySummary}
                    onRegenerate={handleRegenerate}
                  />
                )}
                {!(summary || reasoning || isSummarizing) && (
                  <div className="p-3 flex flex-col gap-2 text-center text-muted-foreground bg-card rounded-lg">
                    Click to generate summary
                    <div className="flex justify-center mb-4">
                      <Button
                        onClick={() => handleSummarize()}
                        className=""
                        variant="outline"
                      >
                        Summarize
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="data">
                <ContentDataView contentData={contentData} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </FontSizeProvider>
  );
};

export default App;