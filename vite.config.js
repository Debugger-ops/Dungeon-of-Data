import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Fills VITE_SITE_URL into the share-preview tags (social sites need absolute URLs for the preview image).
const siteUrl = (env) => ({
  name: 'site-url',
  transformIndexHtml: (html) => {
    const base = (env.VITE_SITE_URL || '').replace(/\/?$/, '/')
    return html.replaceAll('__SITE_URL__', env.VITE_SITE_URL ? base : '')
  },
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return { plugins: [react(), siteUrl(env)], base: './' }
})
