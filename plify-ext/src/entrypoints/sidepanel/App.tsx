import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { RedditService, RedditPost } from '../../lib/reddit-service';
import { Settings, Text, Copy, Check, RefreshCw, Loader2, CircleStop, MessageSquareText } from 'lucide-react';
import { SummaryService } from '../../lib/summary';
import { useToast } from "../../components/ui/use-toast";
import { Toaster } from "../../components/ui/toaster";

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
  const [redditData, setRedditData] = useState<RedditPost | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const { toast } = useToast();

  // Create a single shared instance of SummaryService
  const summaryServiceRef = useRef(new SummaryService());
  // Pass the shared SummaryService to RedditService
  const redditServiceRef = useRef(new RedditService(summaryServiceRef.current));

  const redditService = redditServiceRef.current;
  const summaryService = summaryServiceRef.current;

  const [resultTab, setResultTab] = useState('summary');
  const [emojiPosition, setEmojiPosition] = useState(0);
  const [copied, setCopied] = useState(false);

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  const extractRedditData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await redditService.extractData();
      setRedditData(data);
      return data;
    } catch (err) {
      console.error('Error extracting Reddit data:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const summarizeRedditData = async (data: RedditPost | null = null) => {
    const dataToSummarize = data || redditData;

    if (!dataToSummarize) {
      const errorMessage = 'No Reddit data to summarize. Please extract data first.';
      setError(errorMessage);
      // toast({
      //   variant: "destructive",
      //   title: "Summarization Error",
      //   description: errorMessage,
      // });
      return;
    }

    setIsSummarizing(true);
    setError(null);
    setSummary('');

    try {
      let fullSummary = '';
      let aborted = false;

      // Use the streaming API to get the summary in chunks
      try {
        // Log to confirm we're starting the stream
        console.log('Starting summarization stream...');

        for await (const chunk of redditService.summarizeData(dataToSummarize)) {
          fullSummary += chunk;
          setSummary(fullSummary);
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
      console.error('Error summarizing Reddit data:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during summarization';
      setError(errorMessage);
      // toast({
      //   variant: "destructive",
      //   title: "Summarization Error",
      //   description: errorMessage,
      // });
    } finally {
      console.log('Summarization finished (finally block)');
      setIsSummarizing(false);
    }
  };

  const handleSummarize = async () => {
    // First extract data, then summarize
    setIsLoading(true);
    const extractedData = await extractRedditData();
    if (extractedData) {
      await summarizeRedditData(extractedData);
    }
  };

  const handleCopySummary = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }
  };

  const handleStopSummarization = () => {
    if (isSummarizing) {
      console.log('User stopping summarization...');
      try {
        summaryService.abortStream();
      } catch (error) {
        // Silently catch the AbortError - this is expected
        console.log('Abort operation completed with expected abort error');
        // if (!(error instanceof Error && error.name === 'AbortError')) {
        //   toast({
        //     variant: "destructive",
        //     title: "Error stopping summarization",
        //     description: error instanceof Error ? error.message : 'An unknown error occurred',
        //   });
        // }
      }
      // We don't immediately set isSummarizing to false here
      // Let the summarizeRedditData catch block handle it
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

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 bg-background">
      <Toaster />
      <div className="flex justify-between items-center mb-4 p-1">
        <h2 className="text-xl font-bold text-gradient">Reddit Insight</h2>
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
      {!summary && !redditData && (
        <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground bg-card rounded-lg card-shadow">
          <div className="mb-4">
            <MessageSquareText className="h-12 w-12 opacity-50" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Welcome to Reddit Insight</h3>
          <p className="mb-2">
            Navigate to any Reddit post and click "Summarize" to get started.
          </p>
          <p className="text-sm opacity-75">
            The extension will analyze the post content and comments to generate an insightful summary.
          </p>
        </div>
      )}


      {error && (
        <div className="p-3 mb-4 bg-destructive/10 text-destructive rounded-md shadow-sm">
          {error}
        </div>
      )}

      {(summary || redditData) && (
        <>
          {redditData && (
            <div className="mb-3 mx-2 flex flex-col gap-4">
              <h3 className="text-base font-semibold">{redditData.title || 'Untitled Post'}</h3>
            </div>
          )}
          <Tabs value={resultTab} onValueChange={setResultTab} className="w-full mb-4">
            <TabsList className="grid w-full grid-cols-2 mx-auto bg-secondary">
              <TabsTrigger value="summary" className="px-3 py-1 rounded-full font-semibold hover:bg-primary/20 hover:text-accent-foreground">✨ Summary</TabsTrigger>
              <TabsTrigger value="data" className="px-3 py-1 rounded-full font-semibold hover:bg-primary/20 hover:text-accent-foreground">📄 Content</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              {(isLoading || isSummarizing) && !summary && (
                <div className="p-6 flex flex-col items-center justify-center text-center text-muted-foreground bg-card rounded-lg card-shadow">
                  {/* <div className="mb-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  </div> */}
                  <p className="mb-2 font-medium">
                    {isLoading ? 'Extracting content...' : 'Generating summary...'}
                  </p>
                  <p className="text-sm">
                    {isLoading ? 'Analyzing the page content' : 'Waiting for the first token'}
                  </p>
                </div>
              )}
              {summary && (
                <>
                  <div className="rounded-lg shadow-sm overflow-hidden card-shadow bg-card">
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
                          }}
                        >
                          {summary}
                        </ReactMarkdown>
                      </div>
                    </div>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopySummary}
                          className="text-muted-foreground hover:text-foreground"
                          title="Copy"
                          disabled={isLoading || isSummarizing}
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {!summary && !isSummarizing && (
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
              {redditData ? (
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
              ) : (
                <div className="p-3 text-center text-muted-foreground bg-card rounded-lg card-shadow">
                  No data extracted yet. Click Summarize to extract data.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default App;