Optimized Component Structure.ts
 // ✅ Break into smaller, focused components
// layout.tsx
import { Metadata, Viewport } from "next";
import { RootLayoutInner } from "./RootLayoutInner";
import { metadata, viewport } from "./metadata.config";
import "./globals.css";

export { metadata, viewport };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RootLayoutInner>{children}</RootLayoutInner>
      </body>
    </html>
  );
}

// metadata.config.ts
export const metadata: Metadata = { /* ... */ };
export const viewport: Viewport = { /* ... */ };

// RootLayoutInner.tsx
"use client";
import { Providers } from "./providers";

export function RootLayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      {children}
    </Providers>
  );
}