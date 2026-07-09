import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useDraftStore } from "@/lib/draft-store";
import type { EntryPath } from "@/types";

export function redirectToOnboarding(
  router: AppRouterInstance,
  entryPath: EntryPath,
  returnUrl: string
) {
  useDraftStore.getState().setAuthContext(entryPath, returnUrl);
  router.replace("/onboarding");
}
