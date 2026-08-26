/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#06090F",
        surface: "#0B111A",
        raised: "#101A26",
        line: "#1B2735",
        ink: "#E7EEF6",
        muted: "#7E93AB",
        faint: "#47586C",
        accent: {
          DEFAULT: "#35E4C6",
          dim: "#1CA890",
          deep: "#0E3A34",
        },
        warn: "#F6B23C",
        danger: "#FF4E6A",
        good: "#46E39B",
      },
      fontFamily: {
        display: ['"Space Grotesk"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"IBM Plex Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(53,228,198,0.25), 0 0 24px -6px rgba(53,228,198,0.45)",
        "glow-warn": "0 0 0 1px rgba(246,178,60,0.25), 0 0 24px -6px rgba(246,178,60,0.45)",
        "glow-danger": "0 0 0 1px rgba(255,78,106,0.25), 0 0 24px -6px rgba(255,78,106,0.45)",
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 24px 60px -30px rgba(0,0,0,0.9)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(53,228,198,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(53,228,198,0.06) 1px, transparent 1px)",
      },
      keyframes: {
        "grid-pan": {
          "0%": { backgroundPosition: "0 0, 0 0" },
          "100%": { backgroundPosition: "40px 40px, 40px 40px" },
        },
        scan: {
          "0%": { transform: "translateY(-120%)" },
          "100%": { transform: "translateY(120%)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(260%)" },
        },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        "pulse-ring": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.15" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.85" },
          "50%": { transform: "scale(1.06)", opacity: "1" },
        },
      },
      animation: {
        "grid-pan": "grid-pan 6s linear infinite",
        scan: "scan 5s cubic-bezier(0.4,0,0.2,1) infinite",
        shimmer: "shimmer 1.8s ease-in-out infinite",
        "spin-slow": "spin-slow 16s linear infinite",
        "spin-med": "spin-slow 3.2s linear infinite",
        "spin-fast": "spin-slow 1.6s linear infinite",
        "pulse-ring": "pulse-ring 2.4s ease-in-out infinite",
        blink: "blink 1.3s steps(1,end) infinite",
        rise: "rise 0.35s ease-out both",
        breathe: "breathe 3.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
