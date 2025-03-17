import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Prompt } from './types';
import { Trash2, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "../ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "../ui/use-toast";

// Define the Zod schema for prompt validation
const promptFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Prompt content is required"),
});

type PromptFormValues = z.infer<typeof promptFormSchema>;

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
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const { toast } = useToast();

  // Initialize the form
  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      title: '',
      content: '',
    }
  });

  // Select the first prompt by default when component mounts or prompts change
  useEffect(() => {
    if (prompts.length > 0 && !selectedPromptId && !editingPromptId && !isAdding) {
      const firstPrompt = prompts[0];
      setSelectedPromptId(firstPrompt.id);
      setEditingPromptId(firstPrompt.id);
      form.reset({
        title: firstPrompt.title,
        content: firstPrompt.content,
      });
    }
  }, [prompts, selectedPromptId, editingPromptId, isAdding, form]);

  // Reset form when active prompt changes
  useEffect(() => {
    if (selectedPromptId) {
      const selectedPrompt = prompts.find(p => p.id === selectedPromptId);
      if (selectedPrompt) {
        form.reset({
          title: selectedPrompt.title,
          content: selectedPrompt.content,
        });
      }
    } else if (editingPromptId) {
      const editingPrompt = prompts.find(p => p.id === editingPromptId);
      if (editingPrompt) {
        form.reset({
          title: editingPrompt.title,
          content: editingPrompt.content,
        });
      }
    } else if (isAdding) {
      form.reset({
        title: '',
        content: '',
      });
    }
  }, [selectedPromptId, editingPromptId, isAdding, prompts, form]);

  const handleAddPrompt = () => {
    setIsAdding(true);
    setSelectedPromptId(null);
    setEditingPromptId(null);
    form.reset({
      title: '',
      content: '',
    });
  };

  const handleSelectPrompt = (promptId: string) => {
    const selectedPrompt = prompts.find(p => p.id === promptId);
    if (selectedPrompt) {
      setSelectedPromptId(promptId);
      setEditingPromptId(promptId);
      setIsAdding(false);
      form.reset({
        title: selectedPrompt.title,
        content: selectedPrompt.content,
      });
    }
  };

  const handleDeletePrompt = (promptId: string) => {
    onDeletePrompt(promptId);
    
    if (promptId === selectedPromptId) {
      setSelectedPromptId(null);
    }
  };

  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPromptId(prompt.id);
    setSelectedPromptId(null);
    setIsAdding(false);
    form.reset({
      title: prompt.title,
      content: prompt.content,
    });
  };

  const handleFormSubmit = (data: PromptFormValues) => {
    const promptToSave: Prompt = {
      id: editingPromptId || selectedPromptId || `prompt-${Date.now()}`,
      title: data.title,
      content: data.content,
      createdAt: editingPromptId || selectedPromptId
        ? (prompts.find(p => p.id === (editingPromptId || selectedPromptId))?.createdAt || new Date())
        : new Date(),
      updatedAt: new Date()
    };

    onSavePrompt(promptToSave);
    resetForm();

    toast({
      title: editingPromptId ? "Prompt updated" : "Prompt saved",
      description: editingPromptId
        ? `Successfully updated "${data.title}"`
        : `Successfully saved "${data.title}"`,
      variant: "default",
    });
  };

  const resetForm = () => {
    // Store the current prompt ID before resetting
    const currentPromptId = editingPromptId || selectedPromptId;
    
    setIsAdding(false);
    setEditingPromptId(null);
    
    // If we were editing an existing prompt, keep it selected
    if (currentPromptId && !isAdding) {
      setSelectedPromptId(currentPromptId);
      
      // Reset form to the original prompt values
      const originalPrompt = prompts.find(p => p.id === currentPromptId);
      if (originalPrompt) {
        form.reset({
          title: originalPrompt.title,
          content: originalPrompt.content,
        });
      }
    } else {
      // If we were adding a new prompt, clear selection
      setSelectedPromptId(null);
      form.reset({
        title: '',
        content: '',
      });
    }
  };

  const isFormDirty = form.formState.isDirty;
  const isEditing = isAdding || editingPromptId !== null || (selectedPromptId !== null && isFormDirty);
  
  // Determine when to show action buttons
  const showActionButtons = isAdding || (editingPromptId !== null && isFormDirty) || isFormDirty;

  return (
    <div className="mb-6">
      <h2 className="text-xl mb-4">Prompts Library</h2>

      {prompts.length > 0 && !isAdding && (
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1 mr-4">
            <Select 
              onValueChange={handleSelectPrompt} 
              value={selectedPromptId || (prompts.length > 0 ? prompts[0].id : "")}
              defaultValue={prompts.length > 0 ? prompts[0].id : ""}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a prompt" />
              </SelectTrigger>
              <SelectContent>
                {prompts.map((prompt) => (
                  <SelectItem key={prompt.id} value={prompt.id}>
                    {prompt.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-x-1 flex-shrink-0">
            <Button
              onClick={handleAddPrompt}
              size="icon"
              variant="ghost"
              title="Add new profile"
            >
              <Plus className="h-4 w-4" />
            </Button>
            {selectedPromptId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => selectedPromptId && handleDeletePrompt(selectedPromptId)}
                className="text-red-500"
              >
                <Trash2 className="h-4 w-4 mr-1" />
              </Button>
            )}
          </div>
        </div>
      )}

      {(isAdding || editingPromptId || selectedPromptId) && (
        <>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-base font-normal">Commnd</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter a descriptive prompt command"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-base font-normal">Prompt Template</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your prompt template here..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Create reusable prompt templates to quickly access in your conversations
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 mt-4">
                {showActionButtons && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="text-red-500"
                  >
                    Cancel
                  </Button>
                )}
                {showActionButtons && (
                  <Button type="submit">
                    Save
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </>
      )}

      {prompts.length === 0 && !isEditing && (
        <div className="text-center py-8 border rounded-md bg-gray-50">
          <p className="text-sm text-gray-500 mb-4">You don't have any saved prompts yet.</p>
          <Button variant="default" onClick={handleAddPrompt}>
            Create
          </Button>
        </div>
      )}
    </div>
  );
};

export default Prompts;