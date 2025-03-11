import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  outDir: 'dist',
  manifest: {
    name: 'Plify AI Insight',
    description: 'Get AI insights from webpages with Plify - works privately in your browser using your own API keys.',
    permissions: ['sidePanel', 'activeTab', 'storage'],
    host_permissions: [
      '*://*.reddit.com/*',
      // '<all_urls>'
      // Alternatively, specify only the domains you need:
      // 'https://*.openai.com/*',
      // 'https://api.anthropic.com/*',
      // Add other API domains as needed
    ],
    action: {
      default_title: 'Open Plify AI Insights'
    },
    options_ui: {
      page: 'settings.html',
      open_in_tab: true
    }
  }
});