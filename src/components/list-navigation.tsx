"use client";

import { createContext, useContext, useTransition } from "react";
import { useRouter } from "next/navigation";

type ListNavigation = { pending: boolean; navigate: (href: string) => void };

const Ctx = createContext<ListNavigation>({ pending: false, navigate: () => {} });

/**
 * Shares one navigation transition between the search/filter panel and the patient list,
 * so the list can show a loading state while the new results are on their way.
 */
export function ListNavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = (href: string) => startTransition(() => router.push(href));
  return <Ctx.Provider value={{ pending, navigate }}>{children}</Ctx.Provider>;
}

export function useListNavigation() {
  return useContext(Ctx);
}
