/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#3B82F6',
          lightBlue: '#DCEEFF',
          bgTop: '#F8FAFC',
          border: '#E5E7EB',
          textDark: '#111827',
          grayText: '#6B7280'
        }
      },
      borderRadius: {
        'card': '16px',
        'input': '10px'
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
