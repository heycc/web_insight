import React from 'react';
import { Button } from '../ui/button';
import { Settings, Loader2, CircleStop } from 'lucide-react';

interface HeaderProps {
  currentSite: string;
  isLoading: boolean;
  isSummarizing: boolean;
  onSummarize: () => void;
  onStopSummarization: () => void;
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({
  currentSite,
  isLoading,
  isSummarizing,
  onSummarize,
  onStopSummarization,
  onOpenSettings,
}) => {
  return (
    <div className="flex justify-between items-center mb-4 p-1">
      <h2 className="text-xl font-bold text-gradient">
        {currentSite === 'unknown' ? 'Site Not Supported' : `${currentSite} Insight`}
      </h2>
      <div className="flex items-center gap-2">
        {isSummarizing && (
          <Button
            onClick={onStopSummarization}
            variant="ghost"
            size="default"
            className="text-destructive hover:bg-primary/20 hover:text-destructive"
            title="Stop Generating"
          >
            <CircleStop className="!w-6 !h-6" />
          </Button>
        )}
        <Button
          onClick={onSummarize}
          disabled={isLoading || isSummarizing || currentSite === 'unknown'}
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
          onClick={onOpenSettings}
          variant="ghost"
          size="default"
          className="flex items-center hover:bg-primary/20 p-2"
          title="Configure LLM Provider"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Header; 