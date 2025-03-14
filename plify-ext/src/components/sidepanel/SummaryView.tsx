import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '../../components/ui/button';
import {
  Copy,
  Check,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SummaryViewProps {
  summary: string;
  reasoning: string;
  showReasoning: boolean;
  isSummarizing: boolean;
  isLoading: boolean;
  copiedState: { summary: boolean; withReasoning: boolean };
  onToggleReasoning: () => void;
  onCopy: (includeReasoning: boolean) => void;
  onRegenerate: () => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  summary,
  reasoning,
  showReasoning,
  isSummarizing,
  isLoading,
  copiedState,
  onToggleReasoning,
  onCopy,
  onRegenerate
}) => {
  // Add ref for reasoning container
  const reasoningContainerRef = useRef<HTMLDivElement>(null);
  // Track if user has manually scrolled up
  const [userScrolledUp, setUserScrolledUp] = useState(false);

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

  return (
    <div className="rounded-lg shadow-sm overflow-hidden card-shadow bg-card">
      {reasoning && (
        <div className="">
          <button
            onClick={onToggleReasoning}
            className="w-full p-2 flex items-center justify-between bg-secondary/80 hover:bg-secondary transition-colors"
          >
            <span className="font-medium text-sm text-accent-foreground flex flex-row items-center">
              Model Reasoning
              {(isSummarizing && !summary) && <Loader2 className="h-4 w-4 ml-1 animate-spin text-accent-foreground" />}
            </span>
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
                p: ({ node, ...props }) => <p className="my-2" {...props} />,
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
              animation: 'flyAcross 1s linear infinite',
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
            onClick={onRegenerate}
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
                onClick={() => onCopy(false)}
                className="text-muted-foreground hover:text-foreground mr-2"
                title="Copy summary only"
                disabled={isLoading || isSummarizing}
              >
                {copiedState.summary ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(true)}
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
              onClick={() => onCopy(false)}
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
  );
};

export default SummaryView; 