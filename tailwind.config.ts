import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                "pacewell": {
                  "50": "#f0fdf4",
                  "100": "#dcfce7",
                  "200": "#bbf7d0",
                  "300": "#86efac",
                  "400": "#4ade80",
                  "500": "#22c55e",
                  "600": "#16a34a",
                  "700": "#15803d",
                  "800": "#166534",
                  "900": "#145231",
                  "950": "#082f1e",
                  "dark": "#2D6A4F",
                  "darker": "#1B4332",
                  "accent": "#40916C",
                },
            },
            fontFamily: {
                sans: ["Inter", ...defaultTheme.fontFamily.sans],
            },
            spacing: {
                "safe": "max(1rem, env(safe-area-inset-bottom))",
            },
        },
    },
    plugins: [],
}

export default config