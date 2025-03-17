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

  constructor() {
    this.decoder = new TextDecoder();
    this.systemPrompt = "You are a helpful assistant that give insight of a web page's content and comments.";
    this.logger = createLogger('Summary Service');
  }

  formatPrompt(data: BodyAndCommentsData, language: string = 'en'): string {
    const site = data.site || 'No site name';
    const title = data.title || 'No title';
    const postContent = data.content || 'No content';
    const commentsList = (data.comments || [])
      .filter(c => c && c.content)
      .slice(0, 50)
      .map(c => `## [Author: ${c.author || 'unknown'}, 👍: ${c.score || 0}] \n${c.content?.trim()}\n\n`)
      .join('\n') || 'No comments';

    // Determine response language instruction based on language setting
    let languageInstruction = 'Respond in English';
    if (language === 'zh-CN') {
      languageInstruction = '使用简体中文回答, 但引用的原文应该使用原文的语言.';
    } else if (language === 'ja') {
      languageInstruction = '回答は日本語で行うこと。ただし、引用文については原文の言語表記を維持すること.';
    }

    return `<INSTRUCTIONS>
Please analyze this post and its top N comments to provide insightful perspective.

1. Firstly, thoroughly read the entire post and all comments.
2. Secondly, group similar comments into coherent viewpoints up to 6 ~ 10 viewpoints, prioritizing those with significant engagement and substantive comments, ordered by number of 👍.
3. Thirdly, provide your own perspective, including potential groupthink, bias, or shallowness, and what can we learn from this discussion.

OUTPUT REQUIREMENTS:
- Structure your output in markdown format, see example below.
- LANGUAGE REQUIREMENT: ${languageInstruction}
- BE CONCISE.

OUTPUT EXAMPLE:

## OpenAI's Copyright Fair Use Debate and Corporate Accountability

OpenAI asserts that restricting AI training on copyrighted materials under fair use doctrine would end the AI development race, framing this access ...

## Practical Viewpoints

1. **Open-Source Reciprocity Mandate** (username, username1, 👍 522+)

Argues that AI models trained on copyrighted works should be open-sourced and non-commercial to prevent ...

> "If LLM's need copyrighted works, the model ... should be open sourced ... you can't make money on it as your proprietary only."

2. **Corporate Hypocrisy Critique** (username1, username2, 👍 210+)

Accuses OpenAI of advocating for unilateral copyright exceptions to benefit their business ...

> "Company that needs to steal content to survive criticizes intellectual property."

3. ...

## My Perspectives

**Critical Learning**

1. **Reciprocity as a viable compromise**: The open-source mandate addresses ethical concerns but ...
2. ...

**Potential Groupthink / Bias / Shallowness**

1. ...
2. ...

**In summary**

...

</INSTRUCTIONS>

<PAGE_CONTEXT>
# Site:
${site}

# Page TITLE:
${title}

# CONTENT:
${postContent}

# TOP COMMENTS (Up to 50):
${commentsList}

</PAGE_CONTEXT>
`;
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
      throw new Error('Please configure LLM provider in settings');
    }

    // Always use the first profile
    const activeProfile = settings.profiles[0];
    this.logger.log('Using first profile: [' + activeProfile.profile_name + ']');

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
      provider: activeProfile.provider_type,
      apiKey: activeProfile.api_key,
      apiEndpoint: activeProfile.api_endpoint,
      model: activeProfile.model_name,
      language: language,
      temperature: temperature
    };
  }

  async* streamSummary(
    data: BodyAndCommentsData
  ): AsyncGenerator<{ type: 'content' | 'reasoning', text: string }, void, unknown> {
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
      temperature: settings.temperature,
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
} 