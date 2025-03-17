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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";

// Define the Zod schema for prompt validation
const promptFormSchema = z.object({
  command: z.string()
    .min(1, "command is required")
    .regex(/^\/[a-zA-Z0-9]+$/, "command must start with '/' and contain only letters and numbers")
    .max(32, "command must be 32 characters or less")
    .refine(val => val.startsWith('/'), {
      message: "command must start with '/'",
    }),
  content: z.string().min(1, "Prompt content is required"),
});

type PromptFormValues = z.infer<typeof promptFormSchema>;

interface PromptsProps {
  prompts: Prompt[];
  onSavePrompt: (prompt: Prompt) => void;
  onDeletePrompt: (promptId: string) => void;
}

// Component for the prompt selector
const PromptSelector: React.FC<{
  prompts: Prompt[];
  selectedPromptId: string | null;
  onSelectPrompt: (promptId: string) => void;
  onAddPrompt: () => void;
  onDeletePrompt: (promptId: string) => void;
}> = ({ prompts, selectedPromptId, onSelectPrompt, onAddPrompt, onDeletePrompt }) => {
  const [isDeletePopoverOpen, setIsDeletePopoverOpen] = useState(false);

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex-1 mr-4">
        <Select 
          onValueChange={onSelectPrompt} 
          value={selectedPromptId || (prompts.length > 0 ? prompts[0].id : "")}
          defaultValue={prompts.length > 0 ? prompts[0].id : ""}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a prompt" />
          </SelectTrigger>
          <SelectContent>
            {prompts.map((prompt) => (
              <SelectItem key={prompt.id} value={prompt.id}>
                {prompt.command}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-x-1 flex-shrink-0">
        <Button
          onClick={onAddPrompt}
          size="icon"
          variant="ghost"
          title="Add new prompt"
        >
          <Plus className="h-4 w-4" />
        </Button>
        {selectedPromptId && (
          <Popover open={isDeletePopoverOpen} onOpenChange={setIsDeletePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500"
                title="Delete prompt"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4">
              <div className="space-y-2">
                <h4 className="font-bold">Confirm Deletion</h4>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete this prompt?
                </p>
                <p className="text-sm text-blue-500">
                  {prompts.find(p => p.id === selectedPromptId)?.command}
                </p>
                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDeletePopoverOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      selectedPromptId && onDeletePrompt(selectedPromptId);
                      setIsDeletePopoverOpen(false);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
};

// Component for the prompt form
const PromptForm: React.FC<{
  form: any;
  onSubmit: (data: PromptFormValues) => void;
  onCancel: () => void;
  showActionButtons: boolean;
}> = ({ form, onSubmit, onCancel, showActionButtons }) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="command"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-base font-normal">Command</FormLabel>
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
                  className="min-h-[360px]"
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
              onClick={onCancel}
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
  );
};

// Empty state component
const EmptyState: React.FC<{ onAddPrompt: () => void }> = ({ onAddPrompt }) => {
  return (
    <div className="text-center py-8 border rounded-md bg-gray-50">
      <p className="text-sm text-gray-500 mb-4">You don't have any saved prompts yet.</p>
      <Button variant="default" onClick={onAddPrompt}>
        Create
      </Button>
    </div>
  );
};

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
      command: '',
      content: '',
    }
  });

  // Helper function to update form with prompt data
  const updateFormWithPrompt = (promptId: string | null) => {
    if (!promptId) return;
    
    const prompt = prompts.find(p => p.id === promptId);
    if (prompt) {
      form.reset({
        command: prompt.command,
        content: prompt.content,
      });
    }
  };

  // Select the first prompt by default when component mounts or prompts change
  useEffect(() => {
    if (prompts.length > 0 && !selectedPromptId && !editingPromptId && !isAdding) {
      const firstPrompt = prompts[0];
      setSelectedPromptId(firstPrompt.id);
      updateFormWithPrompt(firstPrompt.id);
    } else if (prompts.length === 0) {
      // Reset form when no prompts are available
      form.reset({
        command: '/',
        content: '',
      });
    }
  }, [prompts]);

  // Sync form with selected prompt whenever selection changes
  useEffect(() => {
    if (isAdding) {
      form.reset({
        command: '/',
        content: '',
      });
    } else if (selectedPromptId) {
      updateFormWithPrompt(selectedPromptId);
      setEditingPromptId(selectedPromptId);
    }
  }, [selectedPromptId, isAdding]);

  const handleAddPrompt = () => {
    setIsAdding(true);
    setSelectedPromptId(null);
    setEditingPromptId(null);
    form.reset({
      command: '/',
      content: '',
    });
  };

  const handleSelectPrompt = (promptId: string) => {
    // Only update if selecting a different prompt
    if (promptId !== selectedPromptId) {
      setSelectedPromptId(promptId);
      setIsAdding(false);
      // Form will be updated by the useEffect hook
    }
  };

  const handleDeletePrompt = (promptId: string) => {
    onDeletePrompt(promptId);
    
    if (promptId === selectedPromptId) {
      // After deletion, check if there are any prompts left
      const remainingPrompts = prompts.filter(p => p.id !== promptId);
      if (remainingPrompts.length > 0) {
        const nextPrompt = remainingPrompts[0];
        setSelectedPromptId(nextPrompt.id);
        setEditingPromptId(nextPrompt.id);
        updateFormWithPrompt(nextPrompt.id);
      } else {
        // If no prompts left, reset everything
        setSelectedPromptId(null);
        setEditingPromptId(null);
        form.reset({
          command: '/',
          content: '',
        });
      }
    }
  };

  const handleFormSubmit = (data: PromptFormValues) => {
    const currentId = editingPromptId || selectedPromptId || `prompt-${Date.now()}`;
    const existingPrompt = prompts.find(p => p.id === currentId);
    
    const promptToSave: Prompt = {
      id: currentId,
      command: data.command,
      content: data.content,
      createdAt: existingPrompt?.createdAt || new Date(),
      updatedAt: new Date()
    };

    onSavePrompt(promptToSave);
    
    // Update state to reflect the saved prompt
    setIsAdding(false);
    setEditingPromptId(null);
    setSelectedPromptId(currentId);
    
    // Reset form state to mark it as pristine but keep values
    form.reset(data);

    toast({
      title: existingPrompt ? "Prompt updated" : "Prompt saved",
      description: existingPrompt
        ? `Successfully updated "${data.command}"`
        : `Successfully saved "${data.command}"`,
      variant: "default",
    });
  };

  const resetForm = () => {
    // Store the current prompt ID before resetting
    const currentPromptId = selectedPromptId;
    
    setIsAdding(false);
    setEditingPromptId(null);
    
    // If we were editing an existing prompt, keep it selected and restore its original values
    if (currentPromptId && prompts.length > 0) {
      updateFormWithPrompt(currentPromptId);
    } else {
      // If we were adding a new prompt or no selection, reset to first prompt if available
      if (prompts.length > 0) {
        setSelectedPromptId(prompts[0].id);
        updateFormWithPrompt(prompts[0].id);
      } else {
        setSelectedPromptId(null);
        form.reset({
          command: '/',
          content: '',
        });
      }
    }
  };

  const isFormDirty = form.formState.isDirty;
  const isEditing = isAdding || (selectedPromptId !== null && isFormDirty);
  
  // Determine when to show action buttons
  const showActionButtons = isAdding || isFormDirty;

  return (
    <div className="mb-6">
      <h2 className="text-xl mb-4">Prompts Library</h2>

      {prompts.length > 0 && !isAdding && (
        <PromptSelector
          prompts={prompts}
          selectedPromptId={selectedPromptId}
          onSelectPrompt={handleSelectPrompt}
          onAddPrompt={handleAddPrompt}
          onDeletePrompt={handleDeletePrompt}
        />
      )}

      {(isAdding || editingPromptId || selectedPromptId) && (
        <PromptForm
          form={form}
          onSubmit={handleFormSubmit}
          onCancel={resetForm}
          showActionButtons={showActionButtons}
        />
      )}

      {prompts.length === 0 && !isEditing && (
        <EmptyState onAddPrompt={handleAddPrompt} />
      )}
    </div>
  );
};

export default Prompts;