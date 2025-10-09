import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import compression from "vite-plugin-compression";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // This allows different configurations for development and production
  const env = loadEnv(mode, process.cwd(), "");

  return {
    // Plugin configuration
    plugins: [
      react(), // Using SWC for faster builds
      tailwindcss(),
      compression({
        algorithm: "gzip",
        ext: ".gz",
        deleteOriginFile: false,
      }),
      compression({
        algorithm: "brotliCompress",
        ext: ".br",
        deleteOriginFile: false,
      }),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png"],
        manifest: {
          name: "Gaming Stake",
          short_name: "Gaming Stake",
          description: "Gaming Stake Platform",
          theme_color: "#ffffff",
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
      }),
    ],

    // Base public path when served in production
    // This is useful when deploying to a subdirectory
    base: "/",

    // Resolve aliases for cleaner imports
    // Makes imports more maintainable and reduces relative path complexity
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"), // Root source directory
        "@components": resolve(__dirname, "./src/components"), // Components directory
        "@assets": resolve(__dirname, "./src/assets"), // Static assets directory
        "@styles": resolve(__dirname, "./src/styles"), // Styles directory
        "@layouts": resolve(__dirname, "./src/layouts"), // Layouts directory
        "@utils": resolve(__dirname, "./src/utils"), // Utils directory
        "@pages": resolve(__dirname, "./src/pages"), // Pages directory
        "@routes": resolve(__dirname, "./src/routes"), // Routes directory
        "@dummy": resolve(__dirname, "./src/__dummy__data"), // Dummy data directory
      },
    },

    // Build configuration for production
    build: {
      // Output directory for production build
      outDir: "dist",

      // Use esbuild for minification (faster than terser)
      // esbuild is significantly faster and still provides excellent minification
      minify: "esbuild",

      // Disable source maps in production for smaller bundle size
      sourcemap: false,

      // Chunk size warning limit (in KB)
      // Helps identify potential performance issues with large chunks
      chunkSizeWarningLimit: 500,

      // Rollup options for fine-grained control over the build
      rollupOptions: {
        output: {
          // Organize output files for better caching and loading performance
          chunkFileNames: "assets/js/[name]-[hash].js", // Chunk files
          entryFileNames: "assets/js/[name]-[hash].js", // Entry point files
          assetFileNames: "assets/[ext]/[name]-[hash].[ext]", // Other assets

          // Manual chunks configuration
          // Separates vendor code for better caching
          manualChunks: {
            vendor: ["react", "react-dom"], // Common vendor dependencies
          },
        },
      },

      // Terser options for additional optimization
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.logs in production
          drop_debugger: true, // Remove debugger statements
        },
      },
    },

    // Development server configuration
    server: {
      port: 3000,
      strictPort: true,
      host: true,
      open: true,
      cors: true,
      proxy: {
        "/api": {
          target: env.VITE_API_URL || "http://localhost:8000",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },

    // Preview server configuration
    // Used to preview production build locally
    preview: {
      port: 3000,
      strictPort: true,
      host: true,
    },

    // Global constants
    // Available in your application code
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version), // App version
    },
  };
});
