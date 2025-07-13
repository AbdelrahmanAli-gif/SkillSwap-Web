/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}", // ← include Flowbite
    "./node_modules/flowbite/**/*.js" // ← include Flowbite core
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('flowbite/plugin') // ← add Flowbite plugin
  ],
};
