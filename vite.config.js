import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ['@zxing/browser', '@zxing/library', 'jsqr'],
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    host: true, // Cho phép lắng nghe từ các IP trong mạng LAN
    port: 5173,  // Hoặc port bạn muốn dùng
  }
})