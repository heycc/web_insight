import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '../../components/ui/button';
import {
  Copy,
  Check,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  ImageDown
} from 'lucide-react';
import rehypeRaw from 'rehype-raw';
import { exportSummaryAsImage } from './SummaryExport';

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
  onUsernameClick?: (username: string) => void;
  title?: string;
  url?: string;
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
  onRegenerate,
  onUsernameClick,
  title,
  url
}) => {
  // Add ref for reasoning container
  const reasoningContainerRef = useRef<HTMLDivElement>(null);
  // Track if user has manually scrolled up
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  // Add a new ref for the summary container
  const summaryContainerRef = useRef<HTMLDivElement>(null);

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

  // Function to preprocess markdown text and fix problematic code fences
  const processMarkdownFence = (text: string): string => {
    if (!text) return '';
    
    // Replace lone triple backticks with escaped backticks or a code block with language
    return text
      // Remove leading code fence with any language indicator at the beginning of the text
      .replace(/^```[a-zA-Z0-9]*\s*\n/m, '')
      // Remove trailing code fence at the end of the text
      .replace(/\n```\s*$/m, '');

      // // Replace standalone triple backticks with escaped version
      // .replace(/^```\s*$/gm, '\\`\\`\\`')
      // // Ensure backticks with no language specified have 'text' as default language
      // .replace(/^```(\s*)$/gm, '```text')
      // // Handle triple backticks at the very end of the text
      // .replace(/```\s*$/g, '```text\n')
  };

  // Process the markdown content before rendering to replace @username with clickable spans
  const addClickableUsernames = (text: string): string => {
    if (!text || !onUsernameClick) return text;
    
    // Replace @username with HTML that will create clickable spans
    // We'll use a special placeholder that we can target with CSS and JavaScript after rendering
    return text.replace(/@([a-zA-Z0-9_\-.]+)/g, '<span class="username-mention" data-username="$1">@$1</span>');
  };

  // Add click handlers to username mentions after the component is rendered
  useEffect(() => {
    if (!onUsernameClick) return;
    
    // Find all username mention elements
    const usernameElements = document.querySelectorAll('.username-mention');
    // Add click handlers
    usernameElements.forEach(element => {
      const username = element.getAttribute('data-username');
      if (username) {
        element.addEventListener('click', () => onUsernameClick(username));
        // Add styling
        element.classList.add('text-primary', 'cursor-pointer', 'hover:underline');
      }
    });
    
    // Clean up event listeners when component unmounts
    return () => {
      usernameElements.forEach(element => {
        const username = element.getAttribute('data-username');
        if (username) {
          element.removeEventListener('click', () => onUsernameClick(username));
        }
      });
    };
  }, [summary, reasoning, showReasoning, onUsernameClick]);

  // Handle export image using the extracted utility
  const handleExportImage = async () => {
    if (!summaryContainerRef.current) return;
    
    try {
      await exportSummaryAsImage({
        containerRef: summaryContainerRef,
        title,
        url,
      });
    } catch (error) {
      console.error('Error exporting image:', error);
    }
  };

  return (
    <div className="rounded-lg shadow-sm overflow-hidden bg-card m-2">
      {reasoning && (
        <div className="p-2">
          <button
            onClick={onToggleReasoning}
            className="w-full p-2 rounded-t-md flex items-center justify-between bg-secondary/80 hover:bg-secondary transition-colors"
          >
            <span className="font-medium text-sm text-accent-foreground flex flex-row items-center">
              Model Reasoning
              {(isSummarizing && !summary) && <Loader2 className="h-4 w-4 ml-1 animate-spin text-accent-foreground" />}
            </span>
            {showReasoning ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showReasoning && (
            <div 
              ref={reasoningContainerRef}
              onScroll={handleReasoningScroll}
              className="p-3 bg-secondary/20 text-sm text-muted-foreground border-t border-border/50 max-h-[300px] overflow-y-auto"
            >
              <ReactMarkdown
                components={{
                  strong: ({ node, ...props }) => <strong className="my-2" {...props} />,
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
                  },
                  p: ({ node, ...props }) => <p className="my-2" {...props} />
                }}
                skipHtml={false}
                remarkPlugins={[]}
                rehypePlugins={[rehypeRaw]}
              >
                {addClickableUsernames(processMarkdownFence(reasoning))}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}
      {summary && (
          <div ref={summaryContainerRef} className="p-2 markdown text-card-foreground">
            <ReactMarkdown
              components={{
                p: ({ node, ...props }) => <p className="my-2" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-4" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-4" {...props} />,
                li: ({ node, ...props }) => (
                  <li className="mt-2" {...props} />
                ),
                h2: ({ node, ...props }) => <h2 className="text-lg font-semibold my-3 text-accent-foreground" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-base font-semibold my-2 text-accent-foreground" {...props} />,
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-4 border-accent pl-4 italic text-muted-foreground"
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
              skipHtml={false}
              remarkPlugins={[]}
              rehypePlugins={[rehypeRaw]}
            >
              {addClickableUsernames(processMarkdownFence(summary))}
            </ReactMarkdown>
          </div>
      )}
      <div className="flex justify-between items-center p-4">
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
            className="text-muted-foreground hover:text-foreground"
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
                className="text-muted-foreground hover:text-foreground"
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

          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportImage}
            className="text-muted-foreground hover:text-foreground mr-2"
            title="Export as image"
            disabled={isLoading || isSummarizing || !summary}
          >
            <ImageDown className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SummaryView; 