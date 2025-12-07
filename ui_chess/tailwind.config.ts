import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
    "./src/styles/*.css", // ⭐ Tailwind được phép scan CSS custom
  ],

  safelist: [
    "square-selected",
    "square-legal",
    "square-last-from",
    "square-last-to",
    "captured-piece",
  ],

  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
