import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  outDir: 'dist',
  manifest: {
    name: 'Plify AI Insights - Reddit & YouTube Summarizer',
    short_name: 'Plify AI Insights',
    version: '0.2.2',
    description: 'Get AI-powered insights from Reddit, YouTube, and more. Works privately in your browser with your own API keys.',
    permissions: ['sidePanel', 'activeTab', 'storage', 'scripting'],
    host_permissions: [
      '*://*.reddit.com/*',
      '*://*.youtube.com/*',
      // '*://*.ycombinator.com/*',
      // Add more sites as needed
    ],
    action: {
      default_title: 'Plify AI Insights',
      default_icon: {
        '16': 'icon/16.png',
        '32': 'icon/32.png',
        '48': 'icon/48.png',
        '128': 'icon/128.png'
      }
    },
    icons: {
      '16': 'icon/16.png',
      '32': 'icon/32.png',
      '48': 'icon/48.png',
      '128': 'icon/128.png'
    },
    options_ui: {
      page: 'settings.html',
      open_in_tab: true
    },
    content_scripts: [
      {
        matches: ['*://*.reddit.com/*', '*://*.youtube.com/*'],
        js: ['content-scripts/content.js']
      },
      {
        matches: ['*://*.reddit.com/*'],
        js: ['reddit-content.js']
      },
      {
        matches: ['*://*.youtube.com/*'],
        js: ['youtube-content.js']
      }
      // },
      // {
      //   matches: ['*://*.ycombinator.com/*'],
      //   js: ['hackernews-content.js']
      // }
    ],
    side_panel: {
      default_path: 'sidepanel.html'
    },
    web_accessible_resources: [{
      resources: ['icons/*', '*.css'],
      matches: ['*://*.reddit.com/*', '*://*.youtube.com/*']
    }]
  }
});