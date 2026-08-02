import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function localSavePlugin() {
  return {
    name: 'local-save-models-data',
    configureServer(server) {
      server.middlewares.use('/api/save-models-data', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const dataPath = path.resolve(__dirname, 'src/data/modelsData.json');
              const parsed = JSON.parse(body);
              fs.writeFileSync(dataPath, JSON.stringify(parsed, null, 2), 'utf-8');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: parsed.length }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end();
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    localSavePlugin()
  ],
});
