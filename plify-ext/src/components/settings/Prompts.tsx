import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Prompt } from './types';
import { PlusCircle, Pencil, Trash2, Save, X } from 'lucide-react';

interface PromptsProps {
  prompts: Prompt[];
  onSavePrompt: (prompt: Prompt) => void;
  onDeletePrompt: (promptId: string) => void;
}

const Prompts: React.FC<PromptsProps> = ({
  prompts,
  onSavePrompt,
  onDeletePrompt
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [newPromptTitle, setNewPromptTitle] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');

  const handleAddPrompt = () => {
    setIsAdding(true);
    setNewPromptTitle('');
    setNewPromptContent('');
  };

  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPromptId(prompt.id);
    setNewPromptTitle(prompt.title);
    setNewPromptContent(prompt.content);
  };

  const handleSavePrompt = () => {
    if (!newPromptTitle.trim() || !newPromptContent.trim()) return;

    const promptToSave: Prompt = {
      id: editingPromptId || `prompt-${Date.now()}`,
      title: newPromptTitle,
      content: newPromptContent,
      createdAt: editingPromptId ? (prompts.find(p => p.id === editingPromptId)?.createdAt || new Date()) : new Date(),
      updatedAt: new Date()
    };

    onSavePrompt(promptToSave);
    resetForm();
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingPromptId(null);
    setNewPromptTitle('');
    setNewPromptContent('');
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl">Saved Prompts</h2>
        <Button onClick={handleAddPrompt} className="flex items-center gap-1">
          <PlusCircle className="h-4 w-4" />
          Add Prompt
        </Button>
      </div>

      {(isAdding || editingPromptId) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingPromptId ? 'Edit Prompt' : 'New Prompt'}</CardTitle>
            <CardDescription>
              {editingPromptId 
                ? 'Update your saved prompt' 
                : 'Create a new prompt template to use in your conversations'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="promptTitle" className="block text-sm font-medium mb-1">
                Title
              </label>
              <Input
                id="promptTitle"
                value={newPromptTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPromptTitle(e.target.value)}
                placeholder="Enter a descriptive title"
              />
            </div>
            <div>
              <label htmlFor="promptContent" className="block text-sm font-medium mb-1">
                Prompt Template
              </label>
              <Textarea
                id="promptContent"
                value={newPromptContent}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewPromptContent(e.target.value)}
                placeholder="Enter your prompt template here..."
                className="min-h-[150px]"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSavePrompt}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </CardFooter>
        </Card>
      )}

      {prompts.length === 0 && !isAdding && (
        <div className="text-center py-8 border rounded-md bg-gray-50">
          <p className="text-gray-500">You don't have any saved prompts yet.</p>
          <Button variant="link" onClick={handleAddPrompt}>
            Create your first prompt
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prompts.map((prompt) => (
          <Card key={prompt.id} className={editingPromptId === prompt.id ? 'hidden' : ''}>
            <CardHeader>
              <CardTitle className="text-lg">{prompt.title}</CardTitle>
              <CardDescription>
                Last updated: {new Date(prompt.updatedAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap line-clamp-3">{prompt.content}</p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => handleEditPrompt(prompt)}>
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDeletePrompt(prompt.id)}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Prompts; 