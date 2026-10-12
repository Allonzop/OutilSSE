import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relatif : fonctionne à la racine (Netlify) comme sous un sous-chemin (GitHub Pages)
export default defineConfig({
  base: './',
  plugins: [react()],
});
