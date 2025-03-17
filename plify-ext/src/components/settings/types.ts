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
  title: string;
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
  [ProviderType.ANTHROPIC]: 'https://api.anthropic.com',
  [ProviderType.GEMINI]: 'https://generativelanguage.googleapis.com',
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