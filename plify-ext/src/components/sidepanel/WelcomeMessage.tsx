import React from 'react';
import { MessageSquareText, ShieldCheck, Brain } from 'lucide-react';

interface WelcomeMessageProps {
  currentSite: string;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ currentSite }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-lg border border-primary/20 animate-fadeIn">
      <div className="mb-6 bg-primary/10 p-4 rounded-full">
        <MessageSquareText className="h-14 w-14 text-primary" />
      </div>
      {/* <h3 className="text-xl font-bold mb-3">Welcome to Plify AI Insight</h3>*/}
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
        Click "Summarize" on any {currentSite !== 'unknown' ? currentSite : 'supported'} page to get started!
      </p>
    </div>
  );
};

export default WelcomeMessage;