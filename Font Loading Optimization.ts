 Font Loading Optimization.ts
// ✅ Better font strategy
const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Consider "optional" for faster paint
  variable: "--font-inter",
  preload: true,
  adjustFontFallback: true, // Add this
  weight: ["400", "500", "600", "700", "800"],
});

// ❌ Remove preload=false for fonts you actually use
const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  preload: false, // Change to true if using above-fold
  weight: ["600", "700", "800"],
});