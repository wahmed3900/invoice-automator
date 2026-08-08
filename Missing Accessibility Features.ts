Missing Accessibility Features.ts
// ✅ Add accessibility defaults
<html 
  lang="en" 
  className={`${inter.variable} ${poppins.variable} ${jetbrains.variable} antialiased`}
  suppressHydrationWarning
>
  <head>
    {/* Add skip-to-content link */}
    <style>{`
      .skip-to-content {
        position: absolute;
        top: -999px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        padding: 0.5rem 1rem;
        background: #2563eb;
        color: white;
        border-radius: 0.5rem;
      }
      .skip-to-content:focus {
        top: 1rem;
      }
    `}</style>
  </head>
  <body>
    <a href="#main-content" className="skip-to-content">
      Skip to main content
    </a>
    <main id="main-content">
      {children}
    </main>
  </body>
</html>