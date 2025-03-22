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
Please provide a clear and concise insight of this page content and top liked comments:

You should read entire content and comments before summarizing. Then group the comments into 5 ~ 8 unique opinions.

Please structure the summary in the following markdown format:

<OUTPUT_FORMAT>
## { here goes the main point of the post }
The main point of the post and comments.

## { here goes the main grouped points in comments }
The Key points of some hot/top comments, group similar comments into one opinion, keep up to 5 ~ 8 opinions in causal logic sequential ordering.

You should also QUOTE KEYWORDS from the original comments (NOT JUST QUOTING THE ENTIRE SENTENCE), especially those from person with unique background.

List them as bullet points.

1. **grouped opinion xx** (author_name, author_name, 👍 n+)
{ here is summary of the opinion }
>{ here is quoted original sentence }

2. **grouped opinion xx** (author_name, 👍 n+)
{ here goes the summary of the opinion }
>{ here is quoted original sentence }

3. **grouped opinion xx** (author_name, 👍 m+)
{ here goes the summary of the opinion }
>{ here is quoted original sentence }

## { here goes the overall sentiment or conclusion }

The overall sentiment or conclusion of the post and comments in your own words.

</OUTPUT_FORMAT>

<LANGUAGE_REQUIREMENT>
\${languageInstruction}
</LANGUAGE_REQUIREMENT>

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
  models: string[];
}

// List of all provider presets, organized as a flat array
export const DEFAULT_PROVIDER_PRESETS: ProviderPreset[] = [
  // OpenAI Official
  {
    id: 'OPENAI_OFFICIAL',
    display_name: 'OpenAI',
    provider_type: ProviderType.OPENAI,
    api_endpoint: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini']
  },
  // OAI Compatible Examples
  {
    id: 'DEEPSEEK_OFFICIAL',
    display_name: 'DeepSeek (深度求索)',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'https://api.deepseek.com',
    models: ['deepseek-chat', 'deepseek-reasoner']
  },
  {
    id: 'VOLCENGINE',
    display_name: 'Volcengine (火山引擎)',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'https://ark.cn-beijing.volces.com/api/v3',
    models: ['deepseek-r1-250120', 'deepseek-v3-241226']
  },
  {
    id: 'BAILIAN_ALIYUN',
    display_name: 'Bailian (阿里云)',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['deepseek-r1', 'deepseek-v3', 'qwen-max', 'qwen-plus', 'qwen-long', 'qwen-turbo']
  },
  {
    id: 'LKEAP_TXYUN',
    display_name: 'LKEAP (腾讯云知识引擎)',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'https://api.lkeap.cloud.tencent.com/v1',
    models: ['deepseek-r1', 'deepseek-v3']
  },
  {
    id: 'HUNYUAN_TXYUN',
    display_name: 'Hunyuan (腾讯云混元)',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'https://api.hunyuan.cloud.tencent.com/v1',
    models: ['hunyuan-t1-latest', 'hunyuan-turbos-latest']
  },
  {
    id: 'SILICONFLOW',
    display_name: 'SiliconFlow (硅基流动)',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'https://api.siliconflow.cn/v1',
    models: ['deepseek-ai/DeepSeek-R1', 'deepseek-ai/DeepSeek-V3']
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