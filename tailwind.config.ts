import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          red: "#E63946",
          gold: "#F4A261",
          green: "#2A9D8F",
        },
        macscore: {
          red: "#E63946",
          gold: "#F4A261",
          green: "#2A9D8F",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "score-gradient": "linear-gradient(135deg, #E63946 0%, #F4A261 50%, #2A9D8F 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
