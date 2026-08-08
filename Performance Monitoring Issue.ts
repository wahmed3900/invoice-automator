// ❌ Current - performance.now() runs on server
const startTime = performance.now();

// ✅ Fix - Only run on client
export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <html>
      <body>
        {children}
        {process.env.NODE_ENV === "development" && (
          <PerformanceMonitor />
        )}
      </body>
    </html>
  );
}