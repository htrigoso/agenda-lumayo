"use client";

import type { Client } from "@/components/client-form";
import { ClientCards } from "@/components/client-cards";

type Props = {
  clients: Client[];
  matches: number;
  page: number;
  pageSize: number;
  term: string;
  onlyPriority: boolean;
  onlyNew: boolean;
  onlyDue: boolean;
  staffNames: Record<string, string>;
  today: string;
  isAdmin: boolean;
};

/** Patient list: a responsive grid of cards on every screen size, with "Ver más" to load the next page. */
export function ClientsView({ clients, matches, page, pageSize, term, onlyPriority, onlyNew, onlyDue, staffNames, today, isAdmin }: Props) {
  return (
    <ClientCards
      // Remount (reset loaded pages) whenever the search, filters or first page change.
      key={`${term}|${onlyPriority}|${onlyNew}|${onlyDue}|${page}|${clients.map((c) => c.id).join(",")}`}
      initial={clients}
      total={matches}
      page={page}
      pageSize={pageSize}
      term={term}
      onlyPriority={onlyPriority}
      onlyNew={onlyNew}
      onlyDue={onlyDue}
      staffNames={staffNames}
      today={today}
      isAdmin={isAdmin}
    />
  );
}
