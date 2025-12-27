/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: '#0a0a12',
                surface: '#161622',
                primary: '#b000ff',
                secondary: '#00f0ff',
                accent: '#ff0055',
                text: '#ffffff',
                'text-muted': '#8b8b9e',
            },
            boxShadow: {
                'glow': '0 0 15px rgba(176, 0, 255, 0.4)',
                'glow-hover': '0 0 25px rgba(176, 0, 255, 0.7)',
                'modal': '0 10px 40px rgba(0, 0, 0, 0.8)',
            },
            borderRadius: {
                'lg': '20px',
                'md': '12px',
                'sm': '8px',
            },
        },
    },
    plugins: [],
}
