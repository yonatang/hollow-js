import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'binaries-server',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/binaries/')) {
            const filePath = path.join(__dirname, 'binaries', req.url.replace('/binaries/', ''))

            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              res.setHeader('Content-Type', 'application/octet-stream')
              fs.createReadStream(filePath).pipe(res)
            } else {
              res.statusCode = 404
              res.end('File not found')
            }
          } else if (req.url?.startsWith('/dist/')) {
            const filePath = path.join(__dirname, '../dist', req.url.replace('/dist/', ''))

            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              res.setHeader('Content-Type', 'application/javascript')
              fs.createReadStream(filePath).pipe(res)
            } else {
              res.statusCode = 404
              res.end('File not found')
            }
          }  else {
            next()
          }
        })
      }
    }
  ],
  // Define path alias for easier imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
})
