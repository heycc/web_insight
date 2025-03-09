export interface RedditData {
  title?: string;
  content?: string;
  author?: string;
  score?: string | number;
  comments?: Array<{
    author?: string;
    content?: string;
    score?: number;
  }>;
}

export interface ApiSettings {
  provider: string;
  apiKey: string;
  apiEndpoint: string;
  model: string;
  language: string;
}

export class SummaryService {
  private decoder: TextDecoder;
  private systemPrompt: string;
  private abortController: AbortController | null = null;

  constructor() {
    this.decoder = new TextDecoder();
    this.systemPrompt = `You are a helpful assistant that give insight of Reddit posts and their comments.
I'm too busy to read the original post and comments.
But I want to know whether this post and comments have any information or perspectives helpful for me to develop my product,
such as person's painpoint, desires, or valuable opinions, or from person with unique background.
I trust you to provide a clear and concise insight of the post and its top up-votes comments.`;
  }

  formatPrompt(data: RedditData, language: string = 'en'): string {
    const title = data.title || 'No title';
    const postContent = data.content || 'No content';
    const commentsList = (data.comments || [])
      .filter(c => c && c.content)
      .slice(0, 30)
      .map(c => `## [Author: ${c.author || 'unknown'}, Up-Votes: ${c.score || 0}] \n${c.content?.trim()}\n\n`)
      .join('\n') || 'No comments';

    // Determine response language instruction based on language setting
    let languageInstruction = 'Remember to respond in English';
    if (language === 'zh-CN') {
      languageInstruction = 'Remember to respond in Simplified Chinese, but the quoted original sentences should be in original language.';
    } else if (language === 'ja') {
      languageInstruction = 'Remember to respond in Japanese, but the quoted original sentences should be in original language.';
    }

    return `Please provide a clear and concise insight of this Reddit post and its top up-votes comments:

You should read entire post and comments before summarizing, then group the comments into 3 ~ 6 opinions.

${languageInstruction}

<instruction>
Please structure the summary in the following markdown format:

## { here goes the main point of the post }

{ here goes the main point of the post }

## { here goes the main grouped points in comments }
The Key points of some hot/top comments, group similar comments into one opinion, keep up to 3 ~ 6 opinions.
You should also QUOTE KEYWORDS from the original comments (NOT JUST QUOTING THE ENTIRE SENTENCE), especially those from person with unique backgroup.
List them as bullet points

1. **grouped opinion xx** (author_name, author_name, Votes: 1000+)
{ here is summary of the opinion }
>{ here is quoted original sentence }

2. **grouped opinion xx** (author_name, Votes: 234+)
{ here goes the summary of the opinion }
>{ here is quoted original sentence }

3. **grouped opinion xx** (author_name, Votes: 45+)
{ here goes the summary of the opinion }
>{ here is quoted original sentence }

## { here goes the overall sentiment or conclusion }

{ here goes the overall sentiment or conclusion }

</instruction>

<reddit_post_context>
# TITLE:
${title}

# POST CONTENT:
${postContent}

# TOP COMMENTS (Up to 30):
${commentsList}

</reddit_post_context>
`;
  }

  async getSettings(): Promise<ApiSettings> {
    const settings = await chrome.storage.local.get(['profiles', 'language']);
    console.log('Fetched settings:', settings.profiles);
    console.log('Fetched language:', settings.language);
    
    // Check if profiles array exists and has content
    if (!Array.isArray(settings.profiles) || settings.profiles.length === 0) {
      console.error('Missing required settings:', {
        hasProfiles: !!settings.profiles,
        profilesType: typeof settings.profiles,
        isArray: Array.isArray(settings.profiles),
        profilesLength: settings.profiles?.length
      });
      throw new Error('Please configure LLM provider in settings');
    }

    // Always use the first profile
    const activeProfile = settings.profiles[0];
    console.log('Using first profile:', activeProfile);

    if (!activeProfile || !activeProfile.provider_type || !activeProfile.api_key || !activeProfile.api_endpoint || !activeProfile.model_name) {
      console.error('Missing required profile fields:', {
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

    return {
      provider: activeProfile.provider_type,
      apiKey: activeProfile.api_key,
      apiEndpoint: activeProfile.api_endpoint,
      model: activeProfile.model_name,
      language: language
    };
  }

  async* streamSummary(data: RedditData): AsyncGenerator<string, void, unknown> {
    // Create a new abort controller for this request
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    
    const settings = await this.getSettings();
    const prompt = this.formatPrompt(data, settings.language);

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
      temperature: 0.5,
      stream: true
    };

    // Make the API request with the abort signal
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
      signal: signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const reader = response.body!.getReader();

    try {
      while (true) {
        // Check if aborted before reading the next chunk
        if (signal.aborted) {
          console.log('Abort detected in the stream loop');
          break;
        }
        
        const { done, value } = await reader.read();
        if (done) break;
  
        const chunk = this.decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          // Check abort signal again to exit as soon as possible
          if (signal.aborted) {
            console.log('Abort detected while processing chunk');
            return;
          }
          
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (data === '[DONE]') {
              console.log('Stream done:', data);
              return;
            }
  
            try {
              const json = JSON.parse(data);
              
              if (json.choices && !json.error) {
                const text = json.choices[0].delta.content || '';
                yield text;
              } else {
                console.error('Invalid response format:', json);
              }
            } catch (error) {
              console.error('Error parsing stream:', error);
            }
          }
        }
      }
    } catch (error: unknown) {
      // Properly type the error
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Stream aborted by user');
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
        console.warn('Error cleaning up stream resources:', e);
      }
      this.abortController = null;
    }
  }

  // Add a method to abort the stream
  abortStream(): void {
    if (this.abortController) {
      console.log('Aborting stream...');
      // Simply abort - the global handler will catch the error
      this.abortController.abort();
      this.abortController = null;
    } else {
      console.warn('No active abort controller to abort');
    }
  }
} 