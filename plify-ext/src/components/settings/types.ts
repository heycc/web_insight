export enum ProviderType {
  OAI_COMPATIBLE = 'oai_compatible',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GEMINI = 'gemini',
  LMSTUDIO = 'lmstudio'
}

export enum ModelName {
  GPT_4 = 'gpt-4o',
  GPT_35_TURBO = 'gpt-4o-mini',
  DEEPSEEK_R1 = 'deepseek-r1',
  DEEPSEEK_V3 = 'deepseek-v3',
  QWEN_LONG = 'qwen-max',
}

export interface Profile {
  index: number;
  profile_name: string;
  provider_type: ProviderType | string;
  api_endpoint: string;
  api_key: string;
  model_name: string;
  temperature: number;
}

export interface Settings {
  profiles: Profile[];
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'zh-CN' | 'ja';
}

// Add default API endpoints for each provider type
export const DEFAULT_API_ENDPOINTS: Record<ProviderType, string> = {
  [ProviderType.OAI_COMPATIBLE]: '',
  [ProviderType.OPENAI]: 'https://api.openai.com/v1',
  [ProviderType.ANTHROPIC]: 'https://api.anthropic.com',
  [ProviderType.GEMINI]: 'https://generativelanguage.googleapis.com',
  [ProviderType.LMSTUDIO]: 'http://127.0.0.1:1234/v1'
}; 