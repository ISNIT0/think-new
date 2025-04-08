/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'pulse-subtle': 'pulse-subtle 1.5s infinite',
        'typing-dot': 'typing-dot 1.4s infinite ease-in-out',
      },
      boxShadow: {
        'message': '0 2px 5px rgba(0, 0, 0, 0.05)',
        'message-hover': '0 4px 8px rgba(0, 0, 0, 0.1)',
      },
      transitionProperty: {
        'message': 'transform, box-shadow, opacity',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}; 