import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    base: process.env.VITE_APP_TARGET === 'mobile' ? './' : '/',
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3002',
                changeOrigin: true
            }
        }
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true,
    }
})
