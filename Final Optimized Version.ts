Final Optimized Version.ts
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "optional",
  variable: "--font-inter",
  adjustFontFallback: true,
  weight: ["400", "500", "600", "700", "800"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Invoice Reminder Automator",
    template: "%s | Invoice Reminder Automator",
  },
  // ... rest of metadata
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen bg-white dark:bg-gray-950 font-sans antialiased">
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <main id="main-content" className="relative min-h-screen">
          {children}
        </main>
        {process.env.NODE_ENV === "production" && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  );
}