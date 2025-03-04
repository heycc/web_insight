import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  manifest: {
    name: 'Web Insight',
    description: 'A demo sidebar extension with Reddit data extraction',
    permissions: ['sidePanel', 'activeTab'],
    host_permissions: ['*://*.reddit.com/*'],
    action: {
      default_title: 'Open Web Insight Sidebar'
    }
  }
});