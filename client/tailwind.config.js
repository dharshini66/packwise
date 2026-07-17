/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { leather: "#6F4E37", passport: "#8B1E3F", terminal: "#1E3A5F", parchment: "#F5F1E8", gold: "#B08D57" },
      fontFamily: { serif: ["Georgia", "serif"] },
      boxShadow: { passport: "0 18px 50px rgba(60, 38, 25, .18)" },
    },
  },
  plugins: [],
};
