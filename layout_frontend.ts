import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

// Optimized font loading with fallbacks
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
  weight: ["400", "500", "600", "700"],
});

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  preload: false, // Only load on-demand
  weight: ["600", "700"],
  fallback: ["Arial", "sans-serif"],
});

// ===== METADATA CONFIGURATION =====
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com"),
  
  title: {
    default: "Invoice Reminder Automator",
    template: "%s | Invoice Reminder Automator",
  },
  description: "Automate invoice reminders, reduce late payments, and streamline your billing process with our intelligent reminder system.",
  
  keywords: [
    "invoice reminders",
    "automated billing",
    "payment reminders",
    "invoice management",
    "late payment recovery",
    "business automation",
    "billing software",
  ],
  
  authors: [
    { name: "Invoice Reminder Automator", url: process.env.NEXT_PUBLIC_APP_URL },
  ],
  
  creator: "Invoice Reminder Automator",
  publisher: "Invoice Reminder Automator",
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/en-US",
      "es": "/es",
      "fr": "/fr",
    },
  },
  
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["es_ES", "fr_FR"],
    url: process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com",
    title: "Invoice Reminder Automator",
    description: "Automate invoice reminders and streamline your billing process",
    siteName: "Invoice Reminder Automator",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Invoice Reminder Automator - Automate Your Billing",
        type: "image/png",
      },
      {
        url: "/og-image-square.png",
        width: 600,
        height: 600,
        alt: "Invoice Reminder Automator Logo",
        type: "image/png",
      },
    ],
    emails: ["support@yourdomain.com"],
    phoneNumbers: ["+1-800-555-0199"],
    countryName: "United States",
  },
  
  twitter: {
    card: "summary_large_image",
    site: "@invoice_reminder",
    creator: "@invoice_reminder",
    title: "Invoice Reminder Automator",
    description: "Automate invoice reminders and streamline your billing process",
    images: {
      url: "/twitter-image.png",
      alt: "Invoice Reminder Automator on Twitter",
    },
  },
  
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { url: "/maskable-icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon-precomposed.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    other: [
      { rel: "apple-touch-icon", url: "/apple-touch-icon.png" },
    ],
  },
  
  manifest: "/manifest.json",
  
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || "",
    yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION || "",
    other: {
      "facebook-domain-verification": process.env.NEXT_PUBLIC_FACEBOOK_VERIFICATION || "",
      "p:domain_verify": process.env.NEXT_PUBLIC_PINTEREST_VERIFICATION || "",
    },
  },
  
  appleWebApp: {
    capable: true,
    title: "Invoice Reminder",
    statusBarStyle: "black-translucent",
    startupImage: [
      {
        url: "/apple-splash-2048-2732.png",
        media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
    url: true,
  },
  
  applicationName: "Invoice Reminder Automator",
  category: "Business",
  classification: "Business, Productivity, Automation",
  
  other: {
    "msapplication-TileColor": "#2563eb",
    "msapplication-config": "/browserconfig.xml",
    "theme-color": "#2563eb",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

// ===== VIEWPORT CONFIGURATION =====
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  colorScheme: "light dark",
};

// ===== COMPONENT PROPS =====
interface RootLayoutProps {
  children: React.ReactNode;
}

// ===== MAIN LAYOUT COMPONENT =====
export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  // Performance monitoring
  const startTime = performance.now();
  
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${poppins.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect to CDN */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="https://your-cdn.com" />
        <link rel="dns-prefetch" href="https://api.supabase.co" />
        
        {/* Preload critical assets */}
        <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        
        {/* Security Headers (set in next.config.js too) */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        
        {/* Performance hints */}
        <link rel="preload" as="image" href="/hero-image.webp" />
        
        {/* Structured Data / JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Invoice Reminder Automator",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description: "Automate invoice reminders and streamline your billing process",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
      </head>
      
      <body className="min-h-screen bg-background font-sans antialiased">
        {/* 
          ===== PROVIDERS =====
          Add your providers here in this order:
          1. Theme Provider (if using dark mode)
          2. Supabase Provider
          3. Query Provider (React Query/SWR)
          4. Toast/Notification Provider
          5. Analytics Provider
        */}
        
        {/* Example: Supabase Provider */}
        {/* <SupabaseProvider> */}
        
          {/* Example: Theme Provider */}
          {/* <ThemeProvider attribute="class" defaultTheme="light" enableSystem> */}
          
            {/* Example: React Query Provider */}
            {/* <QueryProvider> */}
            
              {/* Main Content */}
              {children}
              
              {/* Global Components */}
              {/* <Toaster position="top-right" /> */}
              {/* <Analytics /> */}
              
            {/* </QueryProvider> */}
          {/* </ThemeProvider> */}
        {/* </SupabaseProvider> */}
        
        {/* Performance logging (remove in production) */}
        {process.env.NODE_ENV === "development" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `console.log("Layout rendered in ${(performance.now() - startTime).toFixed(2)}ms")`,
            }}
          />
        )}
      </body>
    </html>
  );
}

// ===== STATIC GENERATION =====
export function generateStaticParams() {
  return [];
}

// ===== REVALIDATION =====
export const revalidate = 3600; // Revalidate every hour