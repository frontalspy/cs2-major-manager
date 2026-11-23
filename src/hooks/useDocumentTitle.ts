import { useEffect } from "react";

export function useDocumentTitle(page: string): void {
  useEffect(() => {
    document.title = `${page} · CS2 Major Simulator — PGL Major Singapore 2026`;
  }, [page]);
}
