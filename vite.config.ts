import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-api-me',
      configureServer(server) {
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
      },
    },
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    globals: true,
  },
});
