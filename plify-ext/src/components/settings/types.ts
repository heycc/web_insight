export enum ProviderType {
  OAI_COMPATIBLE = 'oai_compatible',
  OPENAI = 'openai',
  // ANTHROPIC = 'anthropic',
  // GEMINI = 'gemini',
  LMSTUDIO = 'lmstudio'
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

export enum Language {
  EN = 'en',
  ZH_CN = 'zh-CN',
  ZH_TW = 'zh-TW',
  JA = 'ja',
  KO = 'ko',
  VI = 'vi',
  RU = 'ru',
  ES = 'es',
  FR = 'fr',
  DE = 'de',
  PT = 'pt',
  IT = 'it',
  HI = 'hi',
  TR = 'tr',
  NL = 'nl',
  PL = 'pl',
  TH = 'th',
  ID = 'id'
}

export const LANGUAGE_LABELS: Record<Language, string> = {
  [Language.EN]: '🇺🇸 English',
  [Language.ZH_CN]: '🇨🇳 简体中文',
  [Language.ZH_TW]: '🇭🇰 繁體中文',
  [Language.JA]: '🇯🇵 日本語',
  [Language.KO]: '🇰🇷 한국어',
  [Language.VI]: '🇻🇳 Tiếng Việt',
  [Language.RU]: '🇷🇺 Русский',
  [Language.ES]: '🇪🇸 Español',
  [Language.FR]: '🇫🇷 Français',
  [Language.DE]: '🇩🇪 Deutsch',
  [Language.PT]: '🇵🇹 Português',
  [Language.IT]: '🇮🇹 Italiano',
  [Language.HI]: '🇮🇳 हिन्दी',
  [Language.TR]: '🇹🇷 Türkçe',
  [Language.NL]: '🇳🇱 Nederlands',
  [Language.PL]: '🇵🇱 Polski',
  [Language.TH]: '🇹🇭 ไทย',
  [Language.ID]: '🇮🇩 Bahasa Indonesia'
};

export const LANGUAGE_INSTRUCTIONS: Record<Language, string> = {
  [Language.EN]: 'RESPOND IN ENGLISH',
  [Language.ZH_CN]: 'IMPORTANT: RESPOND IN SIMPLIFIED CHINESE, BUT KEEP THE ORIGINAL LANGUAGE OF THE QUOTED TEXT.',
  [Language.ZH_TW]: 'IMPORTANT: RESPOND IN TRADITIONAL CHINESE, BUT KEEP THE ORIGINAL LANGUAGE OF THE QUOTED TEXT.',
  [Language.JA]: 'IMPORTANT: RESPOND IN JAPANESE, BUT KEEP THE ORIGINAL LANGUAGE OF THE QUOTED TEXT.',
  [Language.KO]: 'IMPORTANT: RESPOND IN KOREAN, BUT KEEP THE ORIGINAL LANGUAGE OF THE QUOTED TEXT.',
  [Language.VI]: 'IMPORTANT: RESPOND IN VIETNAMESE, BUT KEEP THE ORIGINAL LANGUAGE OF THE QUOTED TEXT.',
  [Language.RU]: 'IMPORTANT: RESPOND IN RUSSIAN, BUT KEEP THE ORIGINAL LANGUAGE OF THE QUOTED TEXT.',
  [Language.ES]: 'IMPORTANT: RESPOND IN SPANISH, BUT KEEP THE ORIGINAL LANGUAGE OF THE QUOTED TEXT.',
  [Language.FR]: 'IMPORTANT: RESPOND IN FRENCH, BUT KEEP THE ORIGINAL LANGUAGE OF THE QUOTED TEXT.',
  [Language.DE]: 'IMPORTANT: RESPOND IN GERMAN, BUT KEEP THE ORIGINAL LANGUAGE OF THE QUOTED TEXT.',
  [Language.PT]: 'IMPORTANT: RESPOND IN PORTUGUESE, BUT KEEP THE ORIGINAL LANGUAGE OF THE QUOTED TEXT.',
  [Language.IT]: 'IMPORTANT: RESPOND IN ITALIAN, BUT KEEP THE ORIGINAL LANGUAGE OF THE QUOTED TEXT.',
  [Language.HI]: 'IMPORTANT: RESPOND IN HINDI, BUT KEEP THE ORIGINAL LANGUAGE OF THE QUOTED TEXT.',
  [Language.TR]: 'IMPORTANT: RESPOND IN TURKISH, BUT KEEP THE ORIGINAL LANGUAGE OF THE QUOTED TEXT.',
  [Language.NL]: 'IMPORTANT: RESPOND IN DUTCH, BUT KEEP THE ORIGINAL LANGUAGE OF THE QUOTED TEXT.',
  [Language.PL]: 'IMPORTANT: RESPOND IN POLISH, BUT KEEP THE ORIGINAL LANGUAGE OF THE QUOTED TEXT.',
  [Language.TH]: 'IMPORTANT: RESPOND IN THAI, BUT KEEP THE ORIGINAL LANGUAGE OF THE QUOTED TEXT.',
  [Language.ID]: 'IMPORTANT: RESPOND IN INDONESIAN, BUT KEEP THE ORIGINAL LANGUAGE OF THE QUOTED TEXT.'
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
Analyze the provided web page content (e.g., a Reddit post) and its top-liked comments to extract key insights. Follow these steps:

1. **Comprehensive Reading**: Read the entire post and all comments thoroughly before summarizing.
2. **Aspect Grouping**: Identify and group similar comments into **5–8 distinct and most focused aspects**, prioritizing:
   - Top-voted comments.
   - Unique perspectives (e.g., expert opinions, personal experiences).
   - Comments where authors explicitly mention their background or their stories.
3. **Structured Output**: Present the analysis in the following markdown format:

## Main Point of the Post
A **1–2 sentence summary** of the post's core message, question, or debate.

## Key Grouped Aspects from Comments
Synthesize the most  significant comments into **5–8 logically ordered groups**. For each group:
- **Label**: Briefly name the aspect (e.g., "Support for X," "Criticism of Y").
- **Upvotes**: Note approximate upvotes (e.g., 👍 500+), omit if not available.
- **Authors & Backgrounds**: List usernames and **include their self-described backgrounds or stories if any** (e.g., "as a doctor," "10-year industry veteran").
- **Summary**: Paraphrase the shared viewpoint concisely.
- **Key Quote**: Extract **1–2 short, impactful phrases** (not full sentences) that capture the essence.

**Format Example**:
1. **Group Label** (👍 n+ @username1[background or story], 👍 n+ @username2)
  Summary of the opinion.
  > "Key phrase from comment"

2. **Group Label** (👍 n+ @username13[background or story])
  Summary of the opinion.
  > "Key phrase from comment"

[... Repeat for 5–8 groups ...]

## Overall Sentiment & Conclusion
- Summarize the **general tone** (e.g., supportive, divisive, humorous). Highlight conflicting viewpoints if applicable.
- Provide **your own insights** on the post's impact or unresolved questions.  

<LANGUAGE_REQUIREMENT> 
\${languageInstruction}
</LANGUAGE_REQUIREMENT>  

<ADDITIONAL GUIDELINES>  
- **Background Emphasis**: If an author mentions their profession/experience (e.g., "as a teacher," "worked in tech for 5 years"), **include it in the group label**.  
- **Bias Avoidance**: Represent all sides fairly, even minority opinions.  
- **Quoting**: Never quote full sentences—only **keywords or short phrases**.  
- **Upvote Threshold**: Ignore comments with negligible upvotes unless they offer unique value.  
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
  icon: string;
}

// List of all provider presets, organized as a flat array
export const DEFAULT_PROVIDER_PRESETS: ProviderPreset[] = [
  // OpenAI Official
  {
    id: 'OPENAI_OFFICIAL',
    display_name: 'OpenAI',
    provider_type: ProviderType.OPENAI,
    api_endpoint: 'https://api.openai.com/v1',
    api_key_doc: 'https://platform.openai.com/api-keys',
    models: ['gpt-4o', 'gpt-4o-mini'],
    icon: 'icon/openai.png'
  },
  // OAI Compatible Examples
  {
    id: 'GEMINI_AISTUDIO',
    display_name: 'Gemini (Google AI Studio)',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai',
    api_key_doc: 'https://ai.google.dev/gemini-api/docs/api-key',
    models: ['gemini-2.5-pro-preview-03-25', 'gemini-2.0-flash', 'gemini-2.0-flash-exp', 'gemini-2.0-flash-lite'],
    icon: 'icon/gemini.png'
  },
  {
    id: 'OPENROUTER',
    display_name: 'OpenRouter',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'https://openrouter.ai/api/v1',
    api_key_doc: 'https://openrouter.ai/docs/features/provisioning-api-keys',
    models: [
      'google/gemini-2.5-pro-exp-03-25:free',
      'google/gemini-2.0-flash-exp:free',
      'google/gemini-2.0-flash-thinking-exp-1219:free',
      'google/gemma-3-27b-it:free',
      'google/gemma-2-9b-it:free',
      'deepseek/deepseek-r1:free',
      'deepseek/deepseek-chat-v3-0324:free',
      'deepseek/deepseek-r1-distill-qwen-32b:free',
      'meta-llama/llama-4-maverick:free',
      'meta-llama/llama-4-scout:free',
      'qwen/qwq-32b:free',
      'openrouter/quasar-alpha',
      'mistralai/mistral-small-24b-instruct-2501:free'
    ],
    icon: 'icon/openrouter.png'
  },
  {
    id: 'DEEPSEEK_OFFICIAL',
    display_name: 'DeepSeek',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'https://api.deepseek.com',
    api_key_doc: 'https://api-docs.deepseek.com',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    icon: 'icon/deepseek.png'
  },
  {
    id: 'MOONSHOTAI',
    display_name: 'Moonshot AI',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'https://api.moonshot.cn/v1',
    api_key_doc: 'https://platform.moonshot.cn/docs/intro',
    models: ['moonshot-v1-auto', 'kimi-latest'],
    icon: 'icon/kimi.png'
  },
  {
    id: 'SILICONFLOW',
    display_name: 'SiliconFlow',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'https://api.siliconflow.cn/v1',
    api_key_doc: 'https://docs.siliconflow.cn/cn/userguide/quickstart',
    models: ['deepseek-ai/DeepSeek-R1', 'deepseek-ai/DeepSeek-V3', 'Qwen/QwQ-32B'],
    icon: 'icon/siliconflow.png'
  },
  {
    id: 'VOLCENGINE',
    display_name: 'Volcengine (Bytedance Cloud)',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'https://ark.cn-beijing.volces.com/api/v3',
    api_key_doc: 'https://www.volcengine.com/docs/82379/1399008',
    models: ['deepseek-r1-250120', 'deepseek-v3-250324'],
    icon: 'icon/volcengine.png'
  },
  {
    id: 'BAILIAN_ALIYUN',
    display_name: 'Bailian (Alibaba Cloud)',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    api_key_doc: 'https://help.aliyun.com/zh/model-studio/user-guide/api-key-management',
    models: [
      'deepseek-r1',
      'deepseek-v3',
      'qwq-plus',
      'qwq-32b',
      'qwen-max',
      'qwen-plus',
      'qwen-long',
      'qwen-turbo',
      'qwq-plus-latest',
      'qwen-max-latest',
      'qwen-plus-latest',
      'qwen-long-latest',
      'qwen-turbo-latest'
    ],
    icon: 'icon/aiyun.png'
  },
  {
    id: 'HUNYUAN_TXYUN',
    display_name: 'Hunyuan (Tencent Cloud)',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'https://api.hunyuan.cloud.tencent.com/v1',
    api_key_doc: 'https://cloud.tencent.com/document/product/1729/111008',
    models: ['hunyuan-t1-latest', 'hunyuan-turbos-latest'],
    icon: 'icon/txcloud.png'
  },
  {
    id: 'LKEAP_TXYUN',
    display_name: 'LKEAP (Tencent Cloud)',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'https://api.lkeap.cloud.tencent.com/v1',
    api_key_doc: 'https://cloud.tencent.com/document/product/1772/115970',
    models: ['deepseek-r1', 'deepseek-v3-0324', 'deepseek-v3'],
    icon: 'icon/txcloud.png'
  },
  {
    id: 'ZHIPUAI',
    display_name: 'ZhipuAI',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'https://open.bigmodel.cn/api/paas/v4',
    api_key_doc: 'https://open.bigmodel.cn/dev/api/http-call/http-auth',
    models: ['glm-4-plus', 'glm-4-long', 'glm-4-air', 'glm-4-flash', 'glm-4-airx', 'glm-4-flashx'],
    icon: 'icon/zhipuai.png'
  },
  // LM Studio
  {
    id: 'LMSTUDIO',
    display_name: 'LMStudio (Local)',
    provider_type: ProviderType.OAI_COMPATIBLE,
    api_endpoint: 'http://127.0.0.1:1234/v1',
    models: [],
    icon: 'icon/lmstudio.png'
  }
  // Anthropic Official
  // {
  //   id: 'ANTHROPIC_OFFICIAL',
  //   display_name: 'Anthropic Official',
  //   provider_type: ProviderType.ANTHROPIC,
  //   api_endpoint: 'https://api.anthropic.com',
  //   models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
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