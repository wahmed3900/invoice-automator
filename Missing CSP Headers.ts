Missing CSP Headers.ts
// ✅ Add Content Security Policy
<meta
  httpEquiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://api.supabase.co https://your-cdn.com;
    frame-ancestors 'none';
  "
/>