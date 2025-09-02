import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",   // مهم جداً علشان يشتغل بعد النشر على Vercel/GitHub Pages
  build: {
    outDir: "dist",
  },
})
