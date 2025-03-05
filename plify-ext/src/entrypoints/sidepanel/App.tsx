import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

interface RedditComment {
  author: string;
  content: string;
  score: number;
}

interface RedditPost {
  title: string | null;
  content: string;
  author: string | null;
  score: string | null;
  comments: RedditComment[];
}

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
      // Get the current active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs || tabs.length === 0) {
        throw new Error('No active tab found');
      }
      
      const activeTab = tabs[0];
      
      // Check if we're on a Reddit page
      if (!activeTab.url?.includes('reddit.com')) {
        throw new Error('Not a Reddit page');
      }
      
      if (!activeTab.id) {
        throw new Error('Tab ID is undefined');
      }
      
      // First check if content script is loaded by sending a ping
      try {
        await chrome.tabs.sendMessage(activeTab.id, { action: 'ping' });
      } catch (error) {
        throw new Error('Content script not loaded. Please refresh the Reddit page.');
      }
      
      // Execute script to extract data
      const results = await chrome.tabs.sendMessage(activeTab.id, { action: 'extractRedditData' });
      
      if (results && results.success) {
        setRedditData(results.data);
      } else {
        throw new Error(results?.error || 'Failed to extract data');
      }
    } catch (err) {
      console.error('Error extracting Reddit data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
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
      
      <Button 
        onClick={extractRedditData} 
        disabled={isLoading}
        className="w-full mb-4"
        variant="default"
      >
        {isLoading ? 'Extracting...' : 'Extract Reddit Data'}
      </Button>
      
      {error && (
        <div className="p-3 mb-4 bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}
      
      {redditData && (
        <div className="rounded-lg shadow-sm overflow-hidden">
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