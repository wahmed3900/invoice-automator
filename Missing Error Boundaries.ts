Missing Error Boundaries.ts
// ✅ Implement proper error handling
import { ErrorBoundary } from 'react-error-boundary';

function GlobalErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div role="alert">
      <h2>Something went wrong</h2>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <html>
      <body>
        <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}