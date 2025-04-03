import { createLogger } from './utils';

export interface BodyAndCommentsData {
  title?: string;
  content?: string;
  author?: string;
  score?: string | number;
  site?: string;
  comments?: Array<{
    author?: string;
    content?: string;
    score?: string | number;
  }>;
}

export interface ApiSettings {
  provider: string;
  apiKey: string;
  apiEndpoint: string;
  model: string;
  language: string;
  temperature: number;
}

export class SummaryService {
  private decoder: TextDecoder;
  private systemPrompt: string;
  private abortController: AbortController | null = null;
  private logger;
  private profileListeners: ((hasProfiles: boolean) => void)[] = [];

  constructor() {
    this.decoder = new TextDecoder();
    this.systemPrompt = "You are a helpful assistant that give insight of a web page's content and comments.";
    this.logger = createLogger('Summary Service');

    // Listen for storage changes to detect profile updates
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.profiles) {
        this.logger.log('API profiles updated');
        const hasProfiles = Array.isArray(changes.profiles.newValue) && changes.profiles.newValue.length > 0;
        this.notifyProfileListeners(hasProfiles);
      }
    });
  }

  // Add a method to register profile status change listeners
  addProfileListener(callback: (hasProfiles: boolean) => void): () => void {
    this.profileListeners.push(callback);
    // Return a function to remove the listener
    return () => {
      this.profileListeners = this.profileListeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners of profile status changes
  private notifyProfileListeners(hasProfiles: boolean): void {
    this.profileListeners.forEach(listener => listener(hasProfiles));
  }

  formatPrompt(data: BodyAndCommentsData, language: string = 'en', customPrompt?: string): string {
    const site = data.site || 'No site name';
    const title = data.title || 'No title';
    const postContent = data.content || 'No content';
    const commentsList = (data.comments || [])
      .filter(c => c && c.content)
      .slice(0, 1000)
      .map(c => {
        const authorPart = `Author: ${c.author || 'unknown'}`;
        const scorePart = c.score !== undefined && c.score !== null ? `, 👍: ${c.score}` : '';
        return `## [${authorPart}${scorePart}] \n${c.content?.trim()}\n\n`;
      })
      .join('\n') || 'No comments';

    // If custom prompt is provided, use it instead of the default template
    if (customPrompt) {
      // Determine response language instruction based on language setting
      let languageInstruction = 'RESPOND IN ENGLISH';
      if (language === 'zh-CN') {
        languageInstruction = 'RESPOND IN SIMPLIFIED CHINESE, BUT KEEP THE ORIGINAL LANGUAGE OF THE QUOTED TEXT.';
      } else if (language === 'zh-TW') {
        languageInstruction = 'RESPOND IN TRADITIONAL CHINESE, BUT KEEP THE ORIGINAL LANGUAGE OF THE QUOTED TEXT.';
      } else if (language === 'ja') {
        languageInstruction = 'RESPOND IN JAPANESE, BUT KEEP THE ORIGINAL LANGUAGE OF THE QUOTED TEXT.';
      } else if (language === 'ko') {
        languageInstruction = 'RESPOND IN KOREAN, BUT KEEP THE ORIGINAL LANGUAGE OF THE QUOTED TEXT.';
      } else if (language === 'vi') {
        languageInstruction = 'RESPOND IN VIETNAMESE, BUT KEEP THE ORIGINAL LANGUAGE OF THE QUOTED TEXT.';
      } else if (language === 'ru') {
        languageInstruction = 'RESPOND IN RUSSIAN, BUT KEEP THE ORIGINAL LANGUAGE OF THE QUOTED TEXT.';
      } else if (language === 'es') {
        languageInstruction = 'RESPOND IN SPANISH, BUT KEEP THE ORIGINAL LANGUAGE OF THE QUOTED TEXT.';
      }

      // Replace language placeholder if present in custom prompt
      const promptWithLanguage = customPrompt.replace('${languageInstruction}', languageInstruction);

      // Create the entire prompt with custom instructions
      return `${promptWithLanguage}

<PAGE_CONTEXT>
# Site:
${site}

# Page TITLE:
${title}

# CONTENT:
${postContent}

# TOP COMMENTS (Up to 1000):
${commentsList}

</PAGE_CONTEXT>`;
    }
    return '';
  }

  async getSettings(): Promise<ApiSettings> {
    const settings = await chrome.storage.local.get(['profiles', 'language']);
    
    // Check if profiles array exists and has content
    if (!Array.isArray(settings.profiles) || settings.profiles.length === 0) {
      this.logger.error('Missing required settings:', {
        hasProfiles: !!settings.profiles,
        profilesType: typeof settings.profiles,
        isArray: Array.isArray(settings.profiles),
        profilesLength: settings.profiles?.length
      });
      throw new Error('Configure LLM API in settings to use this extension');
    }

    // Always use the first profile
    const activeProfile = settings.profiles[0];
    // this.logger.log('Using first profile: [' + activeProfile.profile_name + ']');

    if (!activeProfile || !activeProfile.provider_type || !activeProfile.api_key || !activeProfile.api_endpoint || !activeProfile.model_name) {
      this.logger.error('Missing required profile fields:', {
        hasActiveProfile: !!activeProfile,
        provider_type: activeProfile?.provider_type,
        hasApiKey: !!activeProfile?.api_key,
        api_endpoint: activeProfile?.api_endpoint,
        model_name: activeProfile?.model_name,
        activeProfileKeys: activeProfile ? Object.keys(activeProfile) : []
      });
      throw new Error('Active profile is missing required settings');
    }

    // Get language setting, default to 'en' if not found
    const language = settings.language || 'en';
    
    // Get temperature setting, default to 0.6 if not found
    const temperature = activeProfile.temperature !== undefined ? activeProfile.temperature : 0.6;

    return {
      provider: activeProfile.profile_name,
      apiKey: activeProfile.api_key,
      apiEndpoint: activeProfile.api_endpoint,
      model: activeProfile.model_name,
      language: language,
      temperature: temperature
    };
  }

  async* streamSummary(
    data: BodyAndCommentsData,
    customPrompt?: string
  ): AsyncGenerator<{ type: 'content' | 'reasoning', text: string }, void, unknown> {
    // Create a new abort controller for this request
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    
    const settings = await this.getSettings();
    const prompt = this.formatPrompt(data, settings.language, customPrompt);

    // Determine the API endpoint and parameters based on provider type
    let endpoint = settings.apiEndpoint;
    let headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`
    };
    
    let requestBody = {
      model: settings.model,
      messages: [
        {
          role: "system",
          content: this.systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: settings.temperature,
      stream: true
    };

    // Make the API request with the abort signal
    let response;
    try {
      response = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
        signal: signal
      });
    } catch (error: unknown) {
      // Handle fetch errors, including CORS and network issues
      this.logger.error('Fetch error:', error);
      
      // Check for specific error messages that indicate a CORS/preflight issue
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Failed to fetch')) {
        // The following check is specifically for Chrome's error message for CORS issues
        throw new Error(`Request to ${settings.provider} failed, This appears to be a CORS error caused by the API provider. You may need to switch to a different profile.`);
      } else if (errorMessage.includes('NetworkError') || errorMessage.includes('Network request failed')) {
        throw new Error(`Request to ${settings.provider} failed, This appears to be network issue. You may need to switch to a different profile.`);
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        this.logger.log('Request was aborted by user');
        return;
      } else {
        // Re-throw other errors
        throw error;
      }
    }

    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Could not read error response body';
      }
      
      if (response.status === 401) {
        throw new Error(`Authentication failed (401): Your API key may be invalid or expired. Please check your settings.`);
      } else {
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
    }

    const reader = response.body!.getReader();

    try {
      while (true) {
        // Check if aborted before reading the next chunk
        if (signal.aborted) {
          this.logger.log('Abort detected in the stream loop');
          break;
        }
        
        const { done, value } = await reader.read();
        if (done) break;
  
        const chunk = this.decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          // Check abort signal again to exit as soon as possible
          if (signal.aborted) {
            this.logger.log('Abort detected while processing chunk');
            return;
          }
          
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (data === '[DONE]') {
              this.logger.log('Stream done:', data);
              return;
            }
    
            try {
              const json = JSON.parse(data);
              
              if (json.choices && !json.error) {
                // Check for reasoning content
                if (json.choices[0].delta.reasoning_content) {
                  yield { type: 'reasoning', text: json.choices[0].delta.reasoning_content };
                } else if (json.choices[0].delta.reasoning) {
                  yield { type: 'reasoning', text: json.choices[0].delta.reasoning };
                }
                
                // Check for regular content
                if (json.choices[0].delta.content) {
                  yield { type: 'content', text: json.choices[0].delta.content };
                } else if (!json.choices[0].delta.reasoning_content) {
                  // If neither content nor reasoning_content is present, yield empty content
                  yield { type: 'content', text: '' };
                }
              } else if (json.error) {
                throw new Error(`API error: ${JSON.stringify(json.error.message)}`);
              } else {
                throw new Error(`Invalid response format: ${JSON.stringify(json)}`);
              }
            } catch (error) {
              throw new Error(`Error parsing stream: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
        }
      }
    } catch (error: unknown) {
      // Properly type the error
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.log('Stream aborted by user');
      } else {
        throw error;
      }
    } finally {
      // Clean up
      try {
        // Release the reader to properly close the stream
        reader.releaseLock();
        // Close the response body if possible
        if (response.body) {
          response.body.cancel();
        }
      } catch (e) {
        this.logger.warn('Error cleaning up stream resources:', e);
      }
      this.abortController = null;
    }
  }

  // Add a method to abort the stream
  abortStream(): void {
    if (this.abortController) {
      this.logger.log('Aborting stream...');
      // Simply abort - the global handler will catch the error
      this.abortController.abort();
      this.abortController = null;
    } else {
      this.logger.warn('No active abort controller to abort');
    }
  }

  // Add a new method to check if profiles are configured
  async hasApiProfiles(): Promise<boolean> {
    try {
      const settings = await chrome.storage.local.get(['profiles']);
      const hasProfiles = Array.isArray(settings.profiles) && settings.profiles.length > 0;
      return hasProfiles;
    } catch (error) {
      this.logger.error('Error checking for API profiles:', error);
      return false;
    }
  }
} 