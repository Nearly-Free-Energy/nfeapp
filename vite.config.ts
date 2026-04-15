import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const serverEnv = {
    ...env,
    SUPABASE_URL: env.SUPABASE_URL || env.VITE_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY,
  };

  return {
    plugins: [
      react(),
      {
        name: 'local-api-me',
        configureServer(server) {
          Object.assign(process.env, serverEnv);

          server.middlewares.use('/api/me', async (req, res) => {
            const { default: handler } = await server.ssrLoadModule('/api/me.ts');

            await handler(
              {
                method: req.method,
                headers: req.headers,
              },
              {
                status(code: number) {
                  res.statusCode = code;
                  return this;
                },
                json(body: unknown) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(body));
                },
              },
            );
          });

          server.middlewares.use('/api/usage', async (req, res) => {
            const { default: handler } = await server.ssrLoadModule('/api/usage.ts');

            await handler(
              {
                method: req.method,
                headers: req.headers,
              },
              {
                status(code: number) {
                  res.statusCode = code;
                  return this;
                },
                json(body: unknown) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(body));
                },
              },
            );
          });
        },
      },
    ],
    test: {
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      globals: true,
    },
  };
});
