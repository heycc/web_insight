import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  outDir: 'dist',
  manifest: {
    name: 'Web Insight',
    description: 'A demo sidebar extension with Reddit data extraction',
    permissions: ['sidePanel', 'activeTab', 'storage'],
    host_permissions: ['*://*.reddit.com/*'],
    action: {
      default_title: 'Open Web Insight Sidebar'
    },
    options_ui: {
      page: 'settings.html',
      open_in_tab: true
    }
  }
});