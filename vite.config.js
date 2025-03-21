import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,   // Esto hace que Vite escuche en 0.0.0.0
    port: 3000,   // Puedes cambiar el puerto si lo deseas
  },
})
