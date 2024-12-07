import type { Config } from 'tailwindcss';

export default {
    content: ['./src/public/**/*.js', './src/views/**/*.ejs'],
    theme: {
        extend: {},
    },
    plugins: [],
    darkMode: 'selector',
} satisfies Config;
