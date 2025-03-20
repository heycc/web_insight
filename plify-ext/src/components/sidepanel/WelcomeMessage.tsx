import React from 'react';
import { MessageSquareText, ShieldCheck, Brain, Settings } from 'lucide-react';
import { Button } from '../../components/ui/button';

interface WelcomeMessageProps {
  currentSite: string;
  hasApiProfiles?: boolean;
  onOpenSettings?: () => void;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({
  currentSite,
  hasApiProfiles = true,
  onOpenSettings
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-lg border border-primary/20 animate-fadeIn">
      {/* <h3 className="text-xl font-bold mb-3">Welcome to Plify AI Insight</h3>*/}
      {!hasApiProfiles && (
        <div className="w-full p-4 mb-4 bg-yellow-100/50 text-red-800 rounded-lg">
          <p className="font-medium mb-2">API profiles required</p>
          <p className="text-sm mb-3">You need to configure an API profile before using this extension.</p>
          {onOpenSettings && (
            <Button
              onClick={onOpenSettings}
              className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 mx-auto"
            >
              <Settings className="h-4 w-4" />
              Configure API Profiles
            </Button>
          )}
        </div>
      )}
      {hasApiProfiles && (
        <div className="mb-6 bg-primary/10 p-4 rounded-full">
          <MessageSquareText className="h-14 w-14 text-primary" />
        </div>
      )}
      <p className="mb-4 text-lg">
        Get insights when you are exploring
      </p>
      {currentSite === 'unknown' && (
        <p className="mb-4 text-lg">
          Currently supports Reddit & YouTube
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 w-full mb-4">
        <div className="flex flex-col items-center p-3 bg-secondary/30 rounded-lg">
          <Brain className="h-6 w-6 text-primary mb-2" />
          <p className="text-sm">Concise insights for your interested pages</p>
        </div>
        <div className="flex flex-col items-center p-3 bg-secondary/30 rounded-lg">
          <ShieldCheck className="h-6 w-6 text-primary mb-2" />
          <p className="text-sm">Secure with your preferred LLM Service</p>
        </div>
      </div>

      <p className="text-base mt-2">
        {hasApiProfiles
          ? "Click \"Summarize\" or custom command above to get started!"
          : "Configure your API settings to get started!"
        }
      </p>
    </div>
  );
};

export default WelcomeMessage;