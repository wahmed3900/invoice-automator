Better Cache Control for Fonts.ts
// ✅ Add cache control for fonts
<link
  rel="preload"
  href="/fonts/inter-latin-400.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
  // Add these attributes
  fetchPriority="high"
  // Consider adding media attribute for responsive loading
/>