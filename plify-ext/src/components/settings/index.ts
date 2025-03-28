// Export components from main directory
export { default as APIProfilesSection } from './APIProfilesSection';
export { default as LanguagePreference } from './General';
export { default as PrivacyNotice } from './PrivacyNotice';
export { default as Prompts } from './Prompts';
export { default as About } from './About';
export { default as FontSizePreference } from './FontSizePreference';
export { default as FontSizeProvider } from './FontSizeProvider';

// Re-export from profiles subdirectory
export * from './APIProfiles';