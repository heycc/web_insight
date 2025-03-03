export class SummaryService {
  constructor() {
    this.decoder = new TextDecoder();
    this.systemPrompt = `You are a helpful assistant that give insight of Reddit posts and their comments.
I'm too busy to read the original post and comments.
But I want to know whether this post and comments have any information or perspectives helpful for me to develop my product,
such as person's painpoint, desires, or valuable opinions, or from person with unique background.
I trust you to provide a clear and concise insight of the post and its top up-votes comments.`;
  }

  formatPrompt(data) {
    const title = data.title || 'No title';
    const postContent = data.content || 'No content';
    const commentsList = (data.comments || [])
      .filter(c => c && c.content)
      .slice(0, 20)
      .map(c => `## [Author: ${c.author || 'unknown'}, Up-Votes: ${c.score || 0}] \n${c.content.trim()}\n\n`)
      .join('\n') || 'No comments';

    return `Please provide a clear and concise insight of this Reddit post and its top up-votes comments:

You should read entire post and comments before summarizing, then group the comments into 4~6 opinions.

Remember to respond in Simplified Chinese, but the quoted original sentences should be in original language.

<instruction>
Please structure the summary in the following markdown format:

**Main point of the post**

[here goes the main point of the post]

**Main point in comments**

[The Key points of some hot/top comments, up from 4 ~ 6 opinions. You should also quote the original representative sentence, especially those from person with unique backgroup. List them as bullet points]
1. **opinion xx** (author_name, author_name, Votes: 1000+)
here is summary of the opinion
> here is quoted original sentence

2. **opinion xx** (author_name, Votes: 234+)
here is summary of the opinion
> here is quoted original sentence

3. **opinion xx** (author_name, Votes: 45+)
here is summary of the opinion
> here is quoted original sentence

**Overall sentiment**

here goes the overall sentiment or conclusion

</instruction>

<reddit_post_context>
# TITLE:
${title}

# POST CONTENT:
${postContent}

# TOP COMMENTS (Up to 20):
${commentsList}

</reddit_post_context>
`;
  }

  async getSettings() {
    console.log('Fetching settings from storage...');
    const settings = await chrome.storage.local.get([
      'profiles',
      'activeProfileIndex'
    ]);
    console.log('Raw settings from storage:', settings);
    console.log('Profiles array:', settings.profiles);
    console.log('Profiles array length:', settings.profiles?.length);
    console.log('Profiles array type:', typeof settings.profiles);
    console.log('Is profiles an array?', Array.isArray(settings.profiles));

    // Check if profiles array exists and has content
    if (!Array.isArray(settings.profiles) || settings.profiles.length === 0 || typeof settings.activeProfileIndex !== 'number') {
      console.error('Missing required settings:', {
        hasProfiles: !!settings.profiles,
        activeProfileIndex: settings.activeProfileIndex,
        profilesType: typeof settings.profiles,
        isArray: Array.isArray(settings.profiles),
        profilesLength: settings.profiles?.length
      });
      throw new Error('Please configure settings with at least one profile');
    }

    const activeProfile = settings.profiles[settings.activeProfileIndex];
    console.log('Active profile:', activeProfile);
    console.log('Active profile type:', typeof activeProfile);
    console.log('Is activeProfile an object?', activeProfile && typeof activeProfile === 'object');

    if (!activeProfile || !activeProfile.provider || !activeProfile.apiKey || !activeProfile.apiEndpoint || !activeProfile.model) {
      console.error('Missing required profile fields:', {
        hasActiveProfile: !!activeProfile,
        provider: activeProfile?.provider,
        hasApiKey: !!activeProfile?.apiKey,
        apiEndpoint: activeProfile?.apiEndpoint,
        model: activeProfile?.model,
        activeProfileKeys: activeProfile ? Object.keys(activeProfile) : []
      });
      throw new Error('Active profile is missing required settings');
    }

    return activeProfile;
  }

  async* streamSummary(data) {
    const settings = await this.getSettings();
    const prompt = this.formatPrompt(data);

    const response = await fetch(`${settings.apiEndpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
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
      })
    });

    const reader = response.body.getReader();

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