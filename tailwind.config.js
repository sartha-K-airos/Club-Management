/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4a1c84', // Deep purple from the image
          light: '#7a349c',
          dark: '#2d0c5a',
        },
        secondary: {
          DEFAULT: '#11a096', // Teal
          light: '#36c5bc',
        },
        accent: {
          DEFAULT: '#ff8c5f', // Orange
          light: '#ffb59a',
        }
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': 'linear-gradient(to right bottom, #4a1c84, #7a349c)',
      }
    },
  },
  plugins: [],
}
