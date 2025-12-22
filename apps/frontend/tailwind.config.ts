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
      colors: {
        admin: {
          brand: {
            DEFAULT: '#8e213e',
            soft: '#f2e7ea',
            subtle: '#e6ccd2',
            muted: '#d4aab6',
            strong: '#8e213e',
          },
          surface: {
            base: '#ffffff',
            raised: '#faf7f8',
            sunken: '#f4eef0',
            hover: '#f0e6ea',
          },
          text: {
            primary: '#1f1f1f',
            secondary: '#4b4b4b',
            muted: '#7a7a7a',
            inverse: '#ffffff',
            brand: '#8e213e',
          },
          border: {
            DEFAULT: '#e7d7dc',
            subtle: '#efe5e9',
            strong: '#d6b3bc',
            focus: '#c78a99',
          },
          state: {
            success: {
              soft: '#e9f4ef',
              border: '#b9dccc',
              text: '#2e6b4f',
            },
            warning: {
              soft: '#fdf4e8',
              border: '#f0d3a7',
              text: '#8a5a14',
            },
            danger: {
              soft: '#f8e9ec',
              border: '#e3b5bf',
              text: '#7a1f35',
            },
            info: {
              soft: '#eef3f7',
              border: '#c6d8e5',
              text: '#2f5e7a',
            },
          },
        },
      },
    },
  },
  plugins: [],
}
