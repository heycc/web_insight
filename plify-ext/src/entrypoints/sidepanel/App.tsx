import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import {
  Settings,
  Text,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  CircleStop,
  MessageSquareText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SummaryService } from '../../lib/summary';
import { useToast } from "../../components/ui/use-toast";
import { Toaster } from "../../components/ui/toaster";
import { ContentServiceFactory, ContentService, ContentData } from '../../lib/content-service';
import { RedditPost } from '../../lib/reddit-service';
import { YouTubeData } from '../../lib/youtube-service';

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
  const [contentData, setContentData] = useState<ContentData | null>(null);
  const [siteSpecificData, setSiteSpecificData] = useState<RedditPost | YouTubeData | null>(null);
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
  const [emojiPosition, setEmojiPosition] = useState(0);

  // Initialize the content service
  useEffect(() => {
    const initContentService = async () => {
      try {
        const service = await ContentServiceFactory.createService(summaryService);
        contentServiceRef.current = service;
        setCurrentSite(service.getSiteName());
      } catch (error) {
        console.error('Error initializing content service:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize content service');
      }
    };

    initContentService();
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
      const data = await contentServiceRef.current.extractData();
      setContentData(data);

      // Get site-specific data if available
      if (currentSite === 'Reddit') {
        // We already have the content data, so let's avoid making a second network request
        // by treating this data as RedditPost
        setSiteSpecificData(data as any); // Cast to any to avoid type issues
      } else if (currentSite === 'YouTube') {
        // const youtubeService = contentServiceRef.current as any;
        // if (youtubeService.getYouTubeData) {
        //   const youtubeData = await youtubeService.getYouTubeData();
        //   setSiteSpecificData(youtubeData);
        // }
        setSiteSpecificData(data as any); // Cast to any to avoid type issues
      }

      return data;
    } catch (err) {
      console.error(`Error extracting ${currentSite} data:`, err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      
      // Display a more user-friendly message for specific errors
      if (errorMessage.includes('Please navigate to a YouTube video page')) {
        setError('[BUG] Please navigate to a YouTube video page to use this feature');
        toast({
          title: "Not a video page",
          description: "This feature only works on YouTube video pages. Please navigate to a video.",
          variant: "destructive",
        });
      } else {
        setError(errorMessage);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const summarizeContentData = async (data: ContentData | null = null) => {
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
        console.log('Starting summarization stream...');
        
        let reasoningStarted = false;
        let contentStarted = false;
        let reasoningFolded = false;

        for await (const chunk of contentServiceRef.current.summarizeData(dataToSummarize)) {
          if (chunk.type === 'reasoning') {
            fullReasoning += chunk.text;
            setReasoning(fullReasoning);
            
            // Only unfold reasoning when it first appears and hasn't been handled yet
            if (!reasoningStarted && !reasoningFolded) {
              setShowReasoning(true);
              reasoningStarted = true;
            }
          } else if (chunk.type === 'content') {
            fullSummary += chunk.text;
            setSummary(fullSummary);
            
            // Only fold reasoning when first content chunk arrives and hasn't been handled yet
            if (!contentStarted && reasoningStarted && !reasoningFolded) {
              setShowReasoning(false);
              reasoningFolded = true;
              contentStarted = true;
            }
          }
        }
      } catch (err) {
        console.log('Caught error during summarization:', err);

        // Check if this was an abort error
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('Confirmed abort error');
          aborted = true;
        } else if (isSummarizing) {
          // If we're still in summarizing state, assume it was an abort
          console.log('Assuming abort based on state');
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
      console.error('Error summarizing data:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during summarization';
      setError(errorMessage);
    } finally {
      console.log('Summarization finished (finally block)');
      setIsSummarizing(false);
    }
  };

  const handleSummarize = async () => {
    // First extract data, then summarize
    setIsLoading(true);
    const extractedData = await extractContentData();
    if (extractedData) {
      await summarizeContentData(extractedData);
    }
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
      console.log('User stopping summarization...');
      try {
        contentServiceRef.current.stopSummarization();
      } catch (error) {
        // Silently catch the AbortError - this is expected
        console.log('Abort operation completed with expected abort error');
      }
      // We don't immediately set isSummarizing to false here
      // Let the summarizeContentData catch block handle it
    }
  };

  useEffect(() => {
    if (isSummarizing) {
      const interval = setInterval(() => {
        setEmojiPosition((prev) => (prev >= 100 ? 0 : prev + 5));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isSummarizing]);

  // Add scroll handler for reasoning container
  const handleReasoningScroll = () => {
    if (!reasoningContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = reasoningContainerRef.current;
    // Consider user scrolled up if not at the bottom (with a small buffer)
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
    
    setUserScrolledUp(!isAtBottom);
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

  // Helper function to render site-specific content
  const renderSiteSpecificContent = () => {
    if (!siteSpecificData) return null;

    if (currentSite === 'Reddit') {
      const redditData = siteSpecificData as RedditPost;
      return (
        <div className="shadow-sm overflow-hidden card-shadow bg-card rounded-lg">
          <div className="p-4">
            <div className="mb-4 text-base text-card-foreground">{redditData.content}</div>

            <h4 className="font-semibold mb-2 text-accent-foreground">Comments ({redditData.comments.length})</h4>
            <div className="space-y-3">
              {redditData.comments.map((comment, index) => (
                <div key={index} className="border-l-2 border-accent pl-3 hover:bg-accent/10 rounded-r-md transition-colors">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold">{comment.author}</span>
                    <span className="text-muted-foreground">Score: {comment.score}</span>
                  </div>
                  <div>{comment.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    } else if (currentSite === 'YouTube') {
      const youtubeData = siteSpecificData as YouTubeData;
      return (
        <div className="shadow-sm overflow-hidden card-shadow bg-card rounded-lg">
          <div className="p-4">
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold">{youtubeData.author}</span>
                <span className="text-muted-foreground">Likes: {youtubeData.likes}</span>
              </div>
            </div>

            <h4 className="font-semibold mb-2 text-accent-foreground">Comments ({youtubeData.comments.length})</h4>
            <div className="space-y-3">
              {youtubeData.comments.map((comment, index) => (
                <div key={index} className="border-l-2 border-accent pl-3 hover:bg-accent/10 rounded-r-md transition-colors">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold">{comment.author}</span>
                    <span className="text-muted-foreground">
                      {comment.likes !== null ? `Likes: ${comment.likes}` : ''}
                      {comment.timestamp ? ` • ${comment.timestamp}` : ''}
                    </span>
                  </div>
                  <div>{comment.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-3 text-center text-muted-foreground bg-card rounded-lg card-shadow">
        No data extracted yet. Click Summarize to extract data.
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 bg-background">
      <Toaster />
      <div className="flex justify-between items-center mb-4 p-1">
        <h2 className="text-xl font-bold text-gradient">{currentSite} Insight</h2>
        <div className="flex items-center gap-2">
          {isSummarizing && (
            <Button
              onClick={handleStopSummarization}
              variant="ghost"
              size="default"
              className="text-destructive hover:bg-primary/20 hover:text-destructive"
              title="Stop Generating"
            >
              <CircleStop className="!w-6 !h-6" />
            </Button>
          )}
          <Button
            onClick={handleSummarize}
            disabled={isLoading || isSummarizing}
            className="shadow-md hover:shadow-lg transition-all"
            variant="default"
            size="sm"
          >
            {isLoading || isSummarizing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isLoading ? 'Extracting' : 'Summarizing'}
              </span>
            ) : (
              'Summarize'
            )}
          </Button>
          <Button
            onClick={openSettings}
            variant="ghost"
            size="default"
            className="flex items-center hover:bg-primary/20 p-2"
            title="Configure LLM Provider"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Welcome message on first load */}
      {!summary && !contentData && (
        <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground bg-card rounded-lg card-shadow">
          <div className="mb-4">
            <MessageSquareText className="h-12 w-12 opacity-50" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Welcome to Web Insight</h3>
          <p className="mb-2">
            Navigate to any {currentSite !== 'unknown' ? currentSite : 'supported'} page and click "Summarize" to get started.
          </p>
          <p className="text-sm opacity-75">
            The extension will analyze the content and comments to generate an insightful summary.
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 mb-4 bg-destructive/10 text-destructive rounded-md shadow-sm">
          {error}
        </div>
      )}

      {/* Summary or content data */}
      {(summary || contentData) && (
        <>
          {contentData && (
            <div className="mb-3 mx-2 flex flex-col gap-4">
              <h3 className="text-base font-semibold">{contentData.title || 'Untitled Post'}</h3>
            </div>
          )}
          <Tabs value={resultTab} onValueChange={setResultTab} className="w-full mb-4">
            <TabsList className="grid w-full grid-cols-2 mx-auto bg-secondary">
              <TabsTrigger value="summary" className="px-3 py-1 rounded-full font-semibold hover:bg-primary/20 hover:text-accent-foreground">✨ Summary</TabsTrigger>
              <TabsTrigger value="data" className="px-3 py-1 rounded-full font-semibold hover:bg-primary/20 hover:text-accent-foreground">📄 Content</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              {(isLoading || isSummarizing) && !(summary || reasoning) && (
                <div className="p-6 flex flex-col items-center justify-center text-center text-muted-foreground bg-card rounded-lg card-shadow">
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
                <>
                  <div className="rounded-lg shadow-sm overflow-hidden card-shadow bg-card">
                    {reasoning && (
                      <div className="">
                        <button
                          onClick={() => setShowReasoning(!showReasoning)}
                          className="w-full p-2 flex items-center justify-between bg-secondary/80 hover:bg-secondary transition-colors"
                        >
                          {/* <div className="flex flex-row items-center"> */}
                            <span className="font-medium text-sm text-accent-foreground flex flex-row items-center">
                              Model Reasoning
                              {(isSummarizing && !summary) && <Loader2 className="h-4 w-4 ml-1 animate-spin text-accent-foreground" />}
                            </span>
                          {/* </div> */}
                          {showReasoning ?
                            <ChevronUp className="h-4 w-4" /> :
                            <ChevronDown className="h-4 w-4" />
                          }
                        </button>
                        {showReasoning && (
                          <div 
                            ref={reasoningContainerRef}
                            onScroll={handleReasoningScroll}
                            className="p-3 bg-secondary/20 text-sm text-muted-foreground border-t border-border/50 max-h-[300px] overflow-y-auto"
                          >
                            <ReactMarkdown
                              components={{
                                p: ({ node, ...props }) => <p className="my-2" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc pl-4" {...props} />,
                                ol: ({ node, ...props }) => <ol className="list-decimal pl-4" {...props} />,
                                li: ({ node, ...props }) => (
                                  <li className="mt-1" {...props} />
                                ),
                                h2: ({ node, ...props }) => <h2 className="text-base font-semibold my-2 text-accent-foreground" {...props} />,
                                blockquote: ({ node, ...props }) => (
                                  <blockquote
                                    className="border-l-4 border-accent pl-4 py-1 my-2 italic text-muted-foreground"
                                    {...props}
                                  />
                                ),
                                code: ({ node, ...props }: any) => {
                                  const isInline = !props.className?.includes('language-');
                                  return isInline ?
                                    <code className="px-1 py-0.5 bg-muted rounded text-sm" {...props} /> :
                                    <code className="block p-3 bg-muted rounded-md text-sm overflow-x-auto my-3" {...props} />;
                                }
                              }}
                            >
                              {reasoning}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}
                    {summary && (
                      <div className="p-4">
                        <div className="markdown text-card-foreground">
                          <ReactMarkdown
                            components={{
                              ul: ({ node, ...props }) => <ul className="list-disc pl-4" {...props} />,
                              ol: ({ node, ...props }) => <ol className="list-decimal pl-4" {...props} />,
                              li: ({ node, ...props }) => (
                                <li
                                  className="mt-2"
                                  {...props}
                                />
                              ),
                              h2: ({ node, ...props }) => <h2 className="text-lg font-semibold my-3 text-accent-foreground" {...props} />,
                              blockquote: ({ node, ...props }) => (
                                <blockquote
                                  className="border-l-4 border-accent pl-4 py-1 my-2 italic text-muted-foreground"
                                  {...props}
                                />
                              ),
                              code: ({ node, ...props }: any) => {
                                const isInline = !props.className?.includes('language-');
                                return isInline ?
                                  <code className="px-1 py-0.5 bg-muted rounded text-sm" {...props} /> :
                                  <code className="block p-3 bg-muted rounded-md text-sm overflow-x-auto my-3" {...props} />;
                              }
                            }}
                          >
                            {summary}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center p-2 bg-muted/20">
                      {(isSummarizing || isLoading) && (
                        <span
                          className="inline-block text-xl"
                          style={{
                            verticalAlign: 'middle',
                            animation: 'flyAcross 1.2s linear infinite',
                            display: 'inline-block'
                          }}
                        >
                          🛬
                        </span>
                      )}
                      <div className="flex ml-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSummarize}
                          className="text-muted-foreground hover:text-foreground mr-2"
                          title="Regenerate"
                          disabled={isLoading || isSummarizing}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>

                        {reasoning ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopySummary(false)}
                              className="text-muted-foreground hover:text-foreground mr-2"
                              title="Copy summary only"
                              disabled={isLoading || isSummarizing}
                            >
                              {copiedState.summary ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopySummary(true)}
                              className="text-muted-foreground hover:text-foreground"
                              title="Copy with reasoning"
                              disabled={isLoading || isSummarizing}
                            >
                              {copiedState.withReasoning ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              <span className="text-xs">+R</span>
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopySummary(false)}
                            className="text-muted-foreground hover:text-foreground"
                            title="Copy summary"
                            disabled={isLoading || isSummarizing}
                          >
                            {copiedState.summary ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
              {!(summary || reasoning || isSummarizing) && (
                <div className="p-3 flex flex-col gap-2 text-center text-muted-foreground bg-card rounded-lg card-shadow">
                  Click to generate summary
                  <div className="flex justify-center mb-4">
                    <Button
                      onClick={handleSummarize}
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
              {renderSiteSpecificContent()}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default App;