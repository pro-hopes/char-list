import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// TODO: заменить на имя реального GitHub-репозитория перед деплоем,
// напр. base: '/char-list/' -> base: '/<repo-name>/'
export default defineConfig({
  base: '/char-list/',
  plugins: [react()],
})
