import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  test: {
    // Dùng jsdom để giả lập môi trường trình duyệt
    environment: 'jsdom',
    // Chạy file setup trước mỗi test (import jest-dom matchers)
    setupFiles: ['./src/test/setup.ts'],
    // Cho phép dùng describe/it/expect không cần import
    globals: true,
  },
})
