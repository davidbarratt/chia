const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    colors: {
      chia: '#3BAC5C',
      stone: colors.stone,
      amber: colors.amber,
      red: colors.red,
    }
  },
  plugins: [],
}
