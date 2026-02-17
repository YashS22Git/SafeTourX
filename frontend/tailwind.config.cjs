/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#f0f7ff',
                    100: '#e0effe',
                    200: '#bae0fd',
                    300: '#7cc8fc',
                    400: '#38acf8',
                    500: '#0e8ce9',
                    600: '#026fc7',
                    700: '#0358a1',
                    800: '#074a85',
                    900: '#0c3d6e',
                    950: '#082749',
                },
            },
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
            },
            boxShadow: {
                'premium': '0 10px 40px -10px rgba(0, 0, 0, 0.1)',
                'blue-glow': '0 0 20px rgba(14, 140, 233, 0.2)',
            }
        },
    },
    plugins: [],
}
