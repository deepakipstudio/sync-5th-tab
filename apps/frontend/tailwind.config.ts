import type { Config } from 'tailwindcss'

export default <Config>{
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      fontFamily: {
        admin: ['Poppins', 'sans-serif'],
      },
      colors: {
        admin: {
          brand: {
            DEFAULT: '#8e213e',
            // Calm, pastel variations of #8e213e
            soft: '#f5eef1',      // Very light pastel
            subtle: '#ead5dc',    // Light pastel
            muted: '#d4b3c0',     // Medium pastel
            strong: '#8e213e',    // Original brand color
            hover: '#7a1c35',     // Slightly darker for hover states
          },
          surface: {
            base: '#ffffff',
            raised: '#faf9fa',    // Very subtle warm white
            sunken: '#f5f3f4',    // Soft warm grey
            hover: '#f0ecee',     // Light warm grey for hover
          },
          text: {
            primary: '#2d1f23',   // Soft dark, not pure black
            secondary: '#5a4a4f', // Muted warm grey
            muted: '#8a7a7f',     // Light warm grey
            inverse: '#ffffff',
            brand: '#8e213e',
          },
          border: {
            DEFAULT: '#e8dfe3',   // Soft pastel border
            subtle: '#f0e8eb',    // Very light pastel border
            strong: '#d4b3c0',    // Medium pastel border
            focus: '#b892a3',     // Pastel focus color
          },
          state: {
            success: {
              soft: '#eef5f2',   // Pastel green
              border: '#c8ddd4',
              text: '#2d6b4f',
            },
            warning: {
              soft: '#fdf6eb',    // Pastel yellow/amber
              border: '#f0d9b8',
              text: '#8a6a2d',
            },
            danger: {
              soft: '#f8eef1',    // Pastel red (matching brand tone)
              border: '#e3c5ce',
              text: '#8e213e',    // Using brand color for consistency
            },
            info: {
              soft: '#eef3f7',    // Pastel blue
              border: '#c8d8e5',
              text: '#4a6b7a',
            },
          },
        },
      },
    },
  },
  plugins: [],
}
