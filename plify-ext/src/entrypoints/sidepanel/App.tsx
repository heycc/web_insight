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
    <div className="flex flex-col h-full max-w-md mx-auto">
      <header className="bg-primary p-4 text-primary-foreground text-center">
        <h1 className="text-xl font-semibold">Web Insight</h1>
      </header>
      
      <Tabs defaultValue="insights" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="reddit">Reddit</TabsTrigger>
        </TabsList>
        
        <TabsContent value="insights" className="p-4 overflow-y-auto">
          <h2 className="text-lg font-medium mb-4">Page Insights</h2>
          
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">Page Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Load Time</span>
                  <span className="text-2xl font-bold">1.2s</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Resources</span>
                  <span className="text-2xl font-bold">24</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">SEO Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Meta Tags</span>
                  <span className="text-2xl font-bold">8/10</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Headings</span>
                  <span className="text-2xl font-bold">6/10</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notes" className="p-4 overflow-y-auto">
          <h2 className="text-lg font-medium mb-4">Your Notes</h2>
          
          <div className="space-y-2 mb-4">
            {notes.map((note, index) => (
              <div key={index} className="p-3 bg-muted rounded-md">
                {note}
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a new note..."
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
            />
            <Button onClick={handleAddNote}>+</Button>
          </div>
        </TabsContent>
        
        <TabsContent value="reddit" className="p-4 overflow-y-auto">
          <h2 className="text-lg font-medium mb-4">Reddit Data Extractor</h2>
          
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
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{redditData.title || 'Untitled Post'}</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Posted by {redditData.author || 'unknown'} • Score: {redditData.score || '0'}
                </div>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default App; 