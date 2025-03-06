import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { RedditService, RedditPost } from '../../lib/reddit-service';
import { Settings } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('insights');
  const [notes, setNotes] = useState<string[]>([
    'This is a demo note',
    'Click on the + button to add more notes',
  ]);
  const [newNote, setNewNote] = useState('');
  const [redditData, setRedditData] = useState<RedditPost | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [redditService] = useState(() => new RedditService());
  const [resultTab, setResultTab] = useState('summary');

  const handleAddNote = () => {
    if (newNote.trim()) {
      setNotes([...notes, newNote]);
      setNewNote('');
    }
  };

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

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Reddit Data Extractor</h2>
        <Button
          onClick={openSettings}
          variant="ghost"
          size="sm"
          className="flex items-center gap-1"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex mb-4">
        <Button
          onClick={handleSummarize}
          disabled={isLoading || isSummarizing}
          className="flex-1"
          variant="default"
        >
          {isLoading ? 'Extracting...' : isSummarizing ? 'Summarizing...' : 'Summarize'}
        </Button>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}

      {(summary || redditData) && (
        <>
          {redditData && (
            <div className="mb-3 flex flex-col gap-4">
              <h3 className="text-base font-semibold">{redditData.title || 'Untitled Post'}</h3>
              <div className="text-sm">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{redditData.author || 'unknown'}</span>
                  <span className="text-muted-foreground">Score: {redditData.score || '0'}</span>
                </div>
              </div>
            </div>
          )}
          <Tabs value={resultTab} onValueChange={setResultTab} className="w-full mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="data">Extracted Data</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              {summary ? (
                <div className="rounded-lg shadow-sm overflow-hidden">
                  <div className="p-2 whitespace-pre-wrap markdown">
                    {summary}
                  </div>
                </div>
              ) : (
                <div className="p-3 text-center text-muted-foreground">
                  No summary available yet. Click Summarize to generate one.
                </div>
              )}
            </TabsContent>

            <TabsContent value="data">
              {redditData ? (
                <div className="shadow-sm overflow-hidden">
                  <div className="p-2">
                    <div className="mb-4 text-sm">{redditData.content}</div>

                    <h4 className="font-medium mb-2">Comments ({redditData.comments.length})</h4>
                    <div className="space-y-3">
                      {redditData.comments.map((comment, index) => (
                        <div key={index} className="border-l-2 border-muted pl-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{comment.author}</span>
                            <span className="text-muted-foreground">Score: {comment.score}</span>
                          </div>
                          <div className="text-sm">{comment.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 text-center text-muted-foreground">
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