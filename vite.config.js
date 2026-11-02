import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Port 5173 matters: your SecurityConfig CORS only allows http://localhost:5173
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
});
