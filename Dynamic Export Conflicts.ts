Dynamic Export Conflicts.ts
// ❌ Conflicting exports - these contradict each other
export const revalidate = 3600; // ISR
export const dynamic = "force-dynamic"; // Dynamic rendering
export const fetchCache = "force-no-store"; // No caching

// ✅ Choose one strategy:
// Option A: Static with ISR
export const revalidate = 3600;
// Remove force-dynamic and force-no-store

// Option B: Fully dynamic
export const dynamic = "force-dynamic";
// Remove revalidate