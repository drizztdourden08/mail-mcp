import { useState, useCallback } from "react";
import type { ProviderInfo } from "../../../types";

type ActivePage =
  | { type: "toc" }
  | { type: "doc"; sectionId: string }
  | { type: "provider"; providerId: string };

export function useDocsNavigation(initialProviderId?: string | null) {
  const [activePage, setActivePage] = useState<ActivePage>(
    initialProviderId
      ? { type: "provider", providerId: initialProviderId }
      : { type: "toc" },
  );

  const goBack = useCallback(() => setActivePage({ type: "toc" }), []);
  const openDoc = useCallback((sectionId: string) => setActivePage({ type: "doc", sectionId }), []);
  const openProvider = useCallback((providerId: string) => setActivePage({ type: "provider", providerId }), []);

  return { activePage, goBack, openDoc, openProvider };
}
