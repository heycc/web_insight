import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { RedditService, RedditPost } from '../../lib/reddit-service';
import { Settings, Text, Copy, Check, RefreshCw, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [redditData, setRedditData] = useState<RedditPost | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [redditService] = useState(() => new RedditService());
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
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const summarizeRedditData = async (data: RedditPost | null = null) => {
    const dataToSummarize = data || redditData;

    if (!dataToSummarize) {
      setError('No Reddit data to summarize. Please extract data first.');
      return;
    }

    setIsSummarizing(true);
    setError(null);
    setSummary('');

    try {
      let fullSummary = '';

      // Use the streaming API to get the summary in chunks
      for await (const chunk of redditService.summarizeData(dataToSummarize)) {
        fullSummary += chunk;
        setSummary(fullSummary);
      }
    } catch (err) {
      console.error('Error summarizing Reddit data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during summarization');
    } finally {
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
      <div className="flex justify-between items-center mb-4 p-3">
        <h2 className="text-lg font-medium text-blue-800">Reddit Insight</h2>
        <div className="flex items-center gap-2">
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
            size="sm"
            className="flex items-center gap-1 hover:bg-primary/20"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

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
              {/* <div className="text-sm">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-base">{redditData.author || 'unknown'}</span>
                  <span className="text-muted-foreground">Score: {redditData.score || '0'}</span>
                </div>
              </div> */}
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
                  <div className="mb-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  </div>
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