/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        traveloop: {
          sand: "#F5A623",
          "sand-dark": "#D4891E",
          midnight: "#2C3E50",
          mist: "#F7F4EF",
          clay: "#D97757",
          sea: "#4BA3C3",
          forest: "#335C4F",
          surface: "#FAFAFA",
          muted: "#6B7280",
          success: "#10B981",
          danger: "#EF4444",
          border: "#E5E7EB",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 20px 60px rgba(44, 62, 80, 0.12)",
        card: "0 10px 30px rgba(44, 62, 80, 0.08)",
      },
    },
  },
  plugins: [],
};
