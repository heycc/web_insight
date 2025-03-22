import React, { useEffect } from 'react';
import { FontSize, FONT_SIZE_VALUES } from './types';

interface FontSizeProviderProps {
  fontSize: FontSize;
  children: React.ReactNode;
}

const FontSizeProvider: React.FC<FontSizeProviderProps> = ({
  fontSize,
  children
}) => {
  useEffect(() => {
    // Apply the font size using data attribute instead of CSS variables
    // This works with our CSS that targets data-font-size attribute
    document.documentElement.setAttribute('data-font-size', fontSize);
    
    return () => {
      // We don't reset the attribute on unmount because the user's preference
      // should persist throughout the app
    };
  }, [fontSize]);

  return <>{children}</>;
};

export default FontSizeProvider; 