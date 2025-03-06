import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { RedditService, RedditPost } from '../../lib/reddit-service';

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
    } catch (err) {
      console.error('Error extracting Reddit data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const summarizeRedditData = async () => {
    if (!redditData) {
      setError('No Reddit data to summarize. Please extract data first.');
      return;
    }

    setIsSummarizing(true);
    setError(null);
    setSummary('');

    try {
      let fullSummary = '';

      // Use the streaming API to get the summary in chunks
      for await (const chunk of redditService.summarizeData(redditData)) {
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

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Reddit Data Extractor</h2>
        <Button 
          onClick={openSettings}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          Settings
        </Button>
      </div>
      
      <div className="flex gap-2 mb-4">
        <Button 
          onClick={extractRedditData} 
          disabled={isLoading}
          className="flex-1"
          variant="default"
        >
          {isLoading ? 'Extracting...' : 'Extract Reddit Data'}
        </Button>
        
        <Button 
          onClick={summarizeRedditData} 
          disabled={isSummarizing || !redditData}
          className="flex-1"
          variant="secondary"
        >
          {isSummarizing ? 'Summarizing...' : 'Summarize'}
        </Button>
      </div>
      
      {error && (
        <div className="p-3 mb-4 bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}
      
      {summary && (
        <div className="rounded-lg shadow-sm overflow-hidden mb-4 border">
          <div className="p-2 border-b bg-muted/50">
            <h3 className="text-base font-semibold">Summary</h3>
          </div>
          <div className="p-3 whitespace-pre-wrap markdown">
            {summary}
          </div>
        </div>
      )}
      
      {redditData && (
        <div className="rounded-lg shadow-sm overflow-hidden border">
          <div className="p-2 border-b">
            <h3 className="text-base font-semibold">{redditData.title || 'Untitled Post'}</h3>
            <div className="text-sm text-muted-foreground">
              Posted by {redditData.author || 'unknown'} • Score: {redditData.score || '0'}
            </div>
          </div>
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
      )}
    </div>
  );
};

export default App; 