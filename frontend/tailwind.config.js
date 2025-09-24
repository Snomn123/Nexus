/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nexus Brand Colors
        'nexus-primary': '#6366f1',
        'nexus-primary-dark': '#4f46e5', 
        'nexus-primary-light': '#818cf8',
        'nexus-darkest': '#0f0f23',
        'nexus-darker': '#1a1a2e',
        'nexus-dark': '#16213e',
        'nexus-medium': '#1f2937',
        'nexus-accent': '#10b981',
        'nexus-warning': '#f59e0b',
        'nexus-error': '#ef4444',
        // Legacy dark theme colors (maintained for compatibility)
        'discord-dark': '#36393f',
        'discord-darker': '#2f3136', 
        'discord-darkest': '#202225',
        'discord-blue': '#5865f2',
        'discord-green': '#57f287',
        'discord-yellow': '#fee75c',
        'discord-red': '#ed4245',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}