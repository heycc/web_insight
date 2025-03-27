export enum ProviderType {
  OAI_COMPATIBLE = 'oai_compatible',
  OPENAI = 'openai',
  // ANTHROPIC = 'anthropic',
  // GEMINI = 'gemini',
  LMSTUDIO = 'lmstudio'
}

export enum Language {
  EN = 'en',
  ZH_CN = 'zh-CN',
  JA = 'ja'
}

export enum FontSize {
  EXTRA_SMALL = 'extra-small',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'extra-large'
}

export const FONT_SIZE_LABELS: Record<FontSize, string> = {
  [FontSize.EXTRA_SMALL]: 'Extra Small',
  [FontSize.SMALL]: 'Small',
  [FontSize.MEDIUM]: 'Medium',
  [FontSize.LARGE]: 'Large',
  [FontSize.EXTRA_LARGE]: 'Extra Large'
};

export const FONT_SIZE_VALUES: Record<FontSize, string> = {
  [FontSize.EXTRA_SMALL]: '0.75rem',
  [FontSize.SMALL]: '0.875rem',
  [FontSize.MEDIUM]: '1rem',
  [FontSize.LARGE]: '1.125rem',
  [FontSize.EXTRA_LARGE]: '1.25rem'
};

export const LANGUAGE_LABELS: Record<Language, string> = {
  [Language.EN]: 'English',
  [Language.ZH_CN]: '简体中文 (Simplified Chinese)',
  [Language.JA]: '日本語 (Japanese)'
};

export interface Profile {
  index: number;
  profile_name: string;
  provider_type: ProviderType | string;
  api_endpoint: string;
  api_key: string;
  model_name: string;
  temperature: number;
}

export interface Prompt {
  id: string;
  command: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Settings {
  profiles: Profile[];
  theme: 'light' | 'dark' | 'system';
  language: Language;
  prompts: Prompt[];
  fontSize: FontSize;
}

// Add default API endpoints for each provider type
export const DEFAULT_API_ENDPOINTS: Record<ProviderType, string> = {
  [ProviderType.OAI_COMPATIBLE]: '',
  [ProviderType.OPENAI]: 'https://api.openai.com/v1',
  // [ProviderType.ANTHROPIC]: 'https://api.anthropic.com',
  // [ProviderType.GEMINI]: 'https://generativelanguage.googleapis.com',
  [ProviderType.LMSTUDIO]: 'http://127.0.0.1:1234/v1'
};

// Add shared form schema for profile form
import * as z from "zod";

export const profileFormSchema = z.object({
  profile_name: z.string().min(4, "Profile name is required").max(32, "Profile name must be less than 32 characters"),
  provider_type: z.string(),
  api_endpoint: z.string().url("Please enter a valid URL"),
  api_key: z.string().min(1, "API key is required").max(100, "API key must be less than 100 characters"),
  model_name: z.string().min(1, "Model name is required").max(100, "Model name must be less than 100 characters"),
  temperature: z.number().min(0.1, "Temperature must be at least 0.1").max(1.5, "Temperature must be at most 1.5")
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>; 

// Default prompt that will be used when no prompts exist
export const DEFAULT_PROMPT: Prompt = {
  id: "default-summarize",
  command: "/summarize",
  content: `<INSTRUCTION>
Analyze the provided web page content (e.g., Reddit post) and its top-liked comments to extract key insights. Follow these steps:

1. **Comprehensive Reading**: Thoroughly read the entire post and all comments before summarizing.
2. **Opinion Grouping**: Identify and group similar comments into 5–8 distinct opinions, prioritizing top-voted and unique perspectives.
3. **Structured Output**: Present the analysis in the following markdown format:

<OUTPUT_FORMAT>
## Main Point of the Post
A concise summary of the post's core message or question.

## Key Grouped Opinions from Comments
Synthesize the most significant comments into 5–8 logically ordered opinion groups. For each group:  
- Include **author names** and **upvote counts** (e.g., 👍 250+).  
- Summarize the shared viewpoint in your own words.  
- Quote **key phrases or keywords** (not full sentences) that capture the essence.  
- Highlight unique backgrounds (e.g., "as a software engineer...").

Format each group as follows:  

1. **Group Label** (author1, author2, 👍 n+)  
   Summary of the opinion.  
   > "Keyword or impactful phrase from the original comment."  

2. **Group Label** (author3, 👍 m+)  
   Summary of the opinion.  
   > "Keyword or impactful phrase from the original comment."  

... Repeat for 5–8 groups ...

## Overall Sentiment & Conclusion
- Summarize the **general tone** (e.g., supportive, divisive, humorous).  
- Provide **your own conclusion** on the post's impact or unresolved questions.  
</OUTPUT_FORMAT>

<LANGUAGE_REQUIREMENT> 
\${languageInstruction}
</LANGUAGE_REQUIREMENT>  

<ADDITIONAL GUIDELINES>  
- **Accuracy**: Ensure summaries reflect the original intent without distortion.  
- **Brevity**: Keep quotes succinct; avoid full-sentence excerpts.  
- **Diversity**: Include minority opinions if they add value.  
- **Neutrality**: Maintain an unbiased tone unless sentiment analysis is requested.  
</ADDITIONAL GUIDELINES>  
</INSTRUCTION>
`,
  createdAt: new Date(),
  updatedAt: new Date()
};

export interface ProviderPreset {
  id: string;
  display_name: string;
  provider_type: ProviderType;
  api_endpoint: string;
  api_key_doc?: string;
  models: string[];
}

// List of all provider presets, organized as a flat array
export const DEFAULT_PROVIDER_PRESETS: ProviderPreset[] = [
  // OpenAI Official
  {
    id: 'OPENAI_OFFICIAL',
    display_name: 'OpenAI Official',
    provider_type: ProviderType.OPENAI,
    api_endpoint: 'https://api.openai.com/v1',
    api_key_doc: 'https://platform.openai.com/api-keys',
    models: ['gpt-4o', 'gpt-4o-mini']
  },
  // OAI Compatible Examples
  {
    id: 'GEMINI (Google AI Studio)',
    display_name: 'Gemini (Google AI Studio)',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai',
    api_key_doc: 'https://ai.google.dev/gemini-api/docs/api-key',
    models: ['gemini-2.0-flash', 'gemini-2.0-flash-exp', 'gemini-2.0-flash-lite']
  },
  {
    id: 'DEEPSEEK_OFFICIAL',
    display_name: 'DeepSeek Official',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'https://api.deepseek.com',
    api_key_doc: 'https://api-docs.deepseek.com',
    models: ['deepseek-chat', 'deepseek-reasoner']
  },
  {
    id: 'OPENROUTER',
    display_name: 'OpenRouter',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'https://openrouter.ai/api/v1',
    api_key_doc: 'https://openrouter.ai/docs/features/provisioning-api-keys',
    models: [
      'deepseek/deepseek-r1:free',
      'deepseek/deepseek-chat-v3-0324:free',
      'deepseek/deepseek-r1-distill-qwen-32b:free',
      'qwen/qwq-32b:free',
      'google/gemma-2-9b-it:free',
      'mistralai/mistral-small-24b-instruct-2501:free'
    ]
  },
  {
    id: 'SILICONFLOW',
    display_name: 'SiliconFlow',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'https://api.siliconflow.cn/v1',
    api_key_doc: 'https://docs.siliconflow.cn/cn/userguide/quickstart',
    models: ['deepseek-ai/DeepSeek-R1', 'deepseek-ai/DeepSeek-V3', 'Qwen/QwQ-32B']
  },
  {
    id: 'VOLCENGINE',
    display_name: 'Volcengine (火山引擎)',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'https://ark.cn-beijing.volces.com/api/v3',
    api_key_doc: 'https://www.volcengine.com/docs/82379/1399008',
    models: ['deepseek-r1-250120', 'deepseek-v3-250324', 'deepseek-v3-241226']
  },
  {
    id: 'BAILIAN_ALIYUN',
    display_name: 'Bailian (阿里云)',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    api_key_doc: 'https://help.aliyun.com/zh/model-studio/user-guide/api-key-management',
    models: ['deepseek-r1', 'deepseek-v3', 'qwen-max', 'qwen-plus', 'qwen-long', 'qwen-turbo']
  },
  {
    id: 'HUNYUAN_TXYUN',
    display_name: 'Hunyuan (腾讯云混元)',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'https://api.hunyuan.cloud.tencent.com/v1',
    api_key_doc: 'https://cloud.tencent.com/document/product/1729/111008',
    models: ['hunyuan-t1-latest', 'hunyuan-turbos-latest']
  },
  {
    id: 'LKEAP_TXYUN',
    display_name: 'LKEAP (腾讯云知识引擎)',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'https://api.lkeap.cloud.tencent.com/v1',
    api_key_doc: 'https://cloud.tencent.com/document/product/1772/115970',
    models: ['deepseek-r1', 'deepseek-v3-0324', 'deepseek-v3']
  },
  // LM Studio
  {
    id: 'LMSTUDIO',
    display_name: 'LMStudio (Local)',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'http://127.0.0.1:1234/v1',
    models: []
  }
  // Anthropic Official
  // {
  //   id: 'ANTHROPIC_OFFICIAL',
  //   display_name: 'Anthropic Official',
  //   provider_type: ProviderType.ANTHROPIC,
  //   api_endpoint: 'https://api.anthropic.com',
  //   models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
  // },
  
  // Google Official
  // {
  //   id: 'GOOGLE_OFFICIAL',
  //   display_name: 'Google AI Official',
  //   provider_type: ProviderType.GEMINI,
  //   api_endpoint: 'https://generativelanguage.googleapis.com',
  //   models: ['gemini-pro', 'gemini-ultra']
  // },
];

// Helper function to get provider presets by provider type
export const getProviderPresetsByType = (providerType: ProviderType): ProviderPreset[] => {
  return DEFAULT_PROVIDER_PRESETS.filter(preset => preset.provider_type === providerType);
};

// Helper function to get a specific provider preset by ID
export const getProviderPresetById = (id: string): ProviderPreset | undefined => {
  return DEFAULT_PROVIDER_PRESETS.find(preset => preset.id === id);
};

// Helper function to add a custom provider preset
export const addCustomProviderPreset = (
  preset: ProviderPreset,
  presets: ProviderPreset[] = DEFAULT_PROVIDER_PRESETS
): ProviderPreset[] => {
  // Check if preset with same ID exists
  const existingIndex = presets.findIndex(p => p.id === preset.id);
  
  if (existingIndex >= 0) {
    // Replace existing preset
    return [
      ...presets.slice(0, existingIndex),
      preset,
      ...presets.slice(existingIndex + 1)
    ];
  }
  
  // Add new preset
  return [...presets, preset];
};