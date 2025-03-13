import React from 'react';
import { ContentData } from '../../lib/content-service';

interface ContentDataViewProps {
  contentData: ContentData | null;
}

const ContentDataView: React.FC<ContentDataViewProps> = ({ contentData }) => {
  if (!contentData) return null;

  return (
    <div className="shadow-sm overflow-hidden card-shadow bg-card rounded-lg">
      <div className="p-4">
        {contentData.content && (
          <div className="mb-4 text-base text-card-foreground">{contentData.content}</div>
        )}

        {contentData.comments && contentData.comments.length > 0 && (
          <>
            <h4 className="font-semibold mb-2 text-accent-foreground">Comments ({contentData.comments.length})</h4>
            <div className="space-y-3">
              {contentData.comments.map((comment, index) => (
                <div key={index} className="border-l-2 border-accent pl-3 hover:bg-accent/10 rounded-r-md transition-colors">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold">{comment.author}</span>
                    <span className="text-muted-foreground">
                      {/* Display metadata excluding author and content */}
                      {comment && Object.entries(comment)
                        .filter(([key]) => key !== 'author' && key !== 'content')
                        .map(([key, value]) => 
                          <span key={key}>{`${key}: ${value}`} </span>
                        )
                      }
                    </span>
                  </div>
                  <div>{comment.content}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ContentDataView; 