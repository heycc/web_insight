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
}

export class SummaryService {
  private decoder: TextDecoder;
  private systemPrompt: string;

  constructor() {
    this.decoder = new TextDecoder();
    this.systemPrompt = `You are a helpful assistant that give insight of Reddit posts and their comments.
I'm too busy to read the original post and comments.
But I want to know whether this post and comments have any information or perspectives helpful for me to develop my product,
such as person's painpoint, desires, or valuable opinions, or from person with unique background.
I trust you to provide a clear and concise insight of the post and its top up-votes comments.`;
  }

  formatPrompt(data: RedditData): string {
    const title = data.title || 'No title';
    const postContent = data.content || 'No content';
    const commentsList = (data.comments || [])
      .filter(c => c && c.content)
      .slice(0, 30)
      .map(c => `## [Author: ${c.author || 'unknown'}, Up-Votes: ${c.score || 0}] \n${c.content?.trim()}\n\n`)
      .join('\n') || 'No comments';

    return `Please provide a clear and concise insight of this Reddit post and its top up-votes comments:

You should read entire post and comments before summarizing, then group the comments into 4~6 opinions.

Remember to respond in Simplified Chinese, but the quoted original sentences should be in original language.

<instruction>
Please structure the summary in the following markdown format:

**{ here goes the main point of the post }**

{ here goes the main point of the post }

**{ here goes the main point in comments }**
The Key points of some hot/top comments, up from 4 ~ 6 opinions.
You should also QUOTE KEYWORDS from the original comments (NOT JUST QUOTING THE ENTIRE SENTENCE), especially those from person with unique backgroup.
List them as bullet points

1. **opinion xx** (author_name, author_name, Votes: 1000+)
{ here is summary of the opinion }
>{ here is quoted original sentence }

2. **opinion xx** (author_name, Votes: 234+)
{ here goes the summary of the opinion }
>{ here is quoted original sentence }

3. **opinion xx** (author_name, Votes: 45+)
{ here goes the summary of the opinion }
>{ here is quoted original sentence }

**{ here goes the overall sentiment or conclusion }**

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
    const settings = await chrome.storage.local.get(['profiles']);
    console.log('Fetched settings:', settings.profiles);
    
    // Check if profiles array exists and has content
    if (!Array.isArray(settings.profiles) || settings.profiles.length === 0) {
      console.error('Missing required settings:', {
        hasProfiles: !!settings.profiles,
        profilesType: typeof settings.profiles,
        isArray: Array.isArray(settings.profiles),
        profilesLength: settings.profiles?.length
      });
      throw new Error('Please configure settings with at least one profile');
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

    return {
      provider: activeProfile.provider_type,
      apiKey: activeProfile.api_key,
      apiEndpoint: activeProfile.api_endpoint,
      model: activeProfile.model_name
    };
  }

  async* streamSummary(data: RedditData): AsyncGenerator<string, void, unknown> {
    const settings = await this.getSettings();
    const prompt = this.formatPrompt(data);

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
      stream: true
    };

    // Make the API request
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const reader = response.body!.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = this.decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const json = JSON.parse(data);
            const text = json.choices[0].delta.content || '';
            yield text;
          } catch (error) {
            console.error('Error parsing stream:', error);
          }
        }
      }
    }
  }
} 