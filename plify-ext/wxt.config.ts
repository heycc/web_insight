import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  outDir: 'dist',
  manifest: {
    name: 'Plify AI Insight - Reddit & YouTube Summarizer',
    short_name: 'Plify AI Insight',
    version: '0.2.6',
    description: 'Get AI-powered insight from Reddit, YouTube, and more. Works privately in your browser with your own API keys.',
    permissions: ['sidePanel', 'activeTab', 'storage', 'scripting'],
    host_permissions: [
      '*://*.reddit.com/*',
      '*://*.youtube.com/*',
      '*://news.ycombinator.com/*',
      // Add more sites as needed
    ],
    action: {
      default_title: 'Plify AI Insight',
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
        matches: ['*://*.reddit.com/*', '*://*.youtube.com/*', '*://news.ycombinator.com/*'],
        js: ['content-scripts/content.js']
      },
      {
        matches: ['*://*.reddit.com/*'],
        js: ['reddit-content.js']
      },
      {
        matches: ['*://*.youtube.com/*'],
        js: ['youtube-content.js']
      },
      {
        matches: ['*://news.ycombinator.com/item?id=*'],
        js: ['hacker-news-content.js']
      }
    ],
    side_panel: {
      default_path: 'sidepanel.html'
    },
    web_accessible_resources: [{
      resources: ['icons/*', '*.css'],
      matches: ['*://*.reddit.com/*', '*://*.youtube.com/*', '*://news.ycombinator.com/*']
    }]
  },
  dev: {
    server: {
      hostname: '127.0.0.1',
    },
  },
  vite: () => ({
    server: {
      host: '127.0.0.1'
    }
  })
});