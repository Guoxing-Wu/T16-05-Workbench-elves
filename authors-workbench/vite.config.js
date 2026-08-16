// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig({
  base: './',           
  plugins: [react(), viteSingleFile()],
  server: {
    host: true,         
    allowedHosts: true  
  }
})


