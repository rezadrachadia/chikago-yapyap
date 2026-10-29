/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: '#FCEFB4', // Warna background kuning dari logo
          pink: '#F384C6',   // Warna font pink dari logo
        },
      },
      fontFamily: {
        // Plus Jakarta Sans dijadikan font default website
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        // Font Mukadimah tetap tersedia jika ingin dipakai secara spesifik (font-mukadimah)
        mukadimah: ['Mukadimah', 'sans-serif'], 
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(15, 23, 42, 0.25)',
      },
    },
  },
  plugins: [],
};