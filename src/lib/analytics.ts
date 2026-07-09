type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

export function track(event: string, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") return;
  // Placeholder: connect Amplitude / PostHog later
  if (process.env.NODE_ENV === "development") {
    console.info("[analytics]", event, payload);
  }
}
