export class SummaryService {
  constructor() {
    this.decoder = new TextDecoder();
    this.systemPrompt = `You are a helpful assistant that give insight of Reddit posts and their comments.
What ever the language of the post is, you MUST response in Simplifed Chinese.`;
  }

  formatPrompt(data) {
    const title = data.title || 'No title';
    const postContent = data.content || 'No content';
    const commentsList = (data.comments || [])
      .filter(c => c && c.content)
      .slice(0, 5)
      .map(c => `• ${c.content.trim()}`)
      .join('\n') || 'No comments';

    return `Please provide a clear and concise insight of this Reddit post and its top comments:

<reddit_post_context>
# TITLE:
${title}

# POST CONTENT:
${postContent}

# TOP COMMENTS:
${commentsList}

</reddit_post_context>

Please structure the summary in the following markdown format:

**Main point of the post**
<this is the main point of the post>
**Key discussion points from comments**
<key point 1>
<key point 2>
<key point 3>
**Overall sentiment/conclusion**
<this is the overall sentiment or conclusion>

Remember to summarize the post and comments in Simplified Chinese.
`;
  }

  async getSettings() {
    const settings = await chrome.storage.local.get([
      'provider', 
      'apiKey',
      'apiEndpoint',
      'model'
    ]);

    if (!settings.provider || !settings.apiKey || !settings.apiEndpoint || !settings.model) {
      throw new Error('Please configure all required settings');
    }

    return settings;
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