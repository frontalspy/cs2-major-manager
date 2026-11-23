import type { ViewId } from "../types";

// Navigation is hash-based (#/match) so the static build works on GitHub
// Pages without a server-side fallback, and back/forward/deep links work.

export const VIEWS: readonly ViewId[] = ["dash", "teams", "builder", "bracket", "match", "squad", "recap"];

export function parseView(hash: string): ViewId {
  const id = hash.replace(/^#\/?/, "");
  return VIEWS.find((v) => v === id) ?? "dash";
}

export function currentView(): ViewId {
  return typeof window === "undefined" ? "dash" : parseView(window.location.hash);
}

export function navigate(view: ViewId): void {
  window.location.hash = `/${view}`;
}
