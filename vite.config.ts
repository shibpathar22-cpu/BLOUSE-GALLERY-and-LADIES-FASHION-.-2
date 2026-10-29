import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { handleSendOtp, handleVerifyOtp, getSessionUser } from './src/server/apiHandler.ts';

const apiMiddlewarePlugin = (): Plugin => ({
  name: 'api-server-middleware',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url || '';
      if (url.startsWith('/api/')) {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const data = body ? JSON.parse(body) : {};

            if (url.startsWith('/api/auth/send-otp') && req.method === 'POST') {
              const result = handleSendOtp(data.phone || '');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
              return;
            }

            if (url.startsWith('/api/auth/verify-otp') && req.method === 'POST') {
              const result = handleVerifyOtp(data.phone || '', data.otp || '', data.userProfile);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
              return;
            }

            if (url.startsWith('/api/auth/session') && req.method === 'GET') {
              const authHeader = req.headers.authorization;
              const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : '';
              const user = token ? getSessionUser(token) : null;
              if (!user) {
                res.statusCode = 401;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Session invalid or expired' }));
                return;
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ user }));
              return;
            }

            if (url.startsWith('/api/health')) {
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  status: 'ok',
                  app: 'Blouse Gallery & Ladies Fashion',
                  auth: 'Phone OTP Authentication',
                  time: new Date().toISOString(),
                })
              );
              return;
            }
          } catch (err: any) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'API processing error' }));
            return;
          }
          next();
        });
        return;
      }
      next();
    });
  },
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiMiddlewarePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              return 'vendor-libs';
            }
          },
        },
      },
    },
  };
});

