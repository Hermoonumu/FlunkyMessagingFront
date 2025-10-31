import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    allowedHosts: ['flunkymessagingfront.onrender.com'],
    allowedHosts: ['flunkymessagingapp.onrender.com']
    // If you want to allow all hosts (less secure), you can set:
    // allowedHosts: true
  },
  // ... other config ...
});