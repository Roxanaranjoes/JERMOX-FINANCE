import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        login: 'login.html',
        register: 'register.html',
        dashboard: 'dashboard.html',
        tax: 'tax.html',
        'demo-notifications': 'demo-notifications.html'
      }
    }
  }
})
