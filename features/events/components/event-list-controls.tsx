"use client";

import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";

import { EVENT_SORTS, type EventSort } from "@/features/events/constants";
import {
  buildEventListHref,
  type EventListParams,
} from "@/features/events/utils/search-params";

type EventListControlsProps = {
  params: EventListParams;
  regions: string[];
};

// Shared look for both dropdowns.
const selectClass: string =
  "rounded-full border border-roya-slate/30 bg-white px-3 py-2 text-roya-ink";

/**
 * Region and sort dropdowns. A Client Component because it reacts to
 * onChange; it doesn't keep its own state, it just changes the URL and the
 * server renders the new list.
 * @param props.params The current list params from the URL.
 * @param props.regions The regions that have events.
 * @returns The two dropdowns.
 */
export function EventListControls({ params, regions }: EventListControlsProps) {
  const router = useRouter();

  /**
   * Navigates to the list with some params changed, keeping the scroll position.
   * @param changes The params to change.
   */
  function update(changes: Partial<EventListParams>): void {
    router.push(buildEventListHref({ ...params, ...changes }), { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-roya-slate">
      <label className="flex items-center gap-2">
        <span>Region</span>
        {/* defaultValue, not value: the URL is the source of truth, and the page
            re-renders with the new value after navigation. */}
        <select
          className={selectClass}
          defaultValue={params.region ?? ""}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => update({ region: e.target.value || null })}
        >
          <option value="">All regions</option>
          {regions.map((region: string) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2">
        <span>Sort by</span>
        <select
          className={selectClass}
          defaultValue={params.sort}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => update({ sort: e.target.value as EventSort })}
        >
          {EVENT_SORTS.map((sort: (typeof EVENT_SORTS)[number]) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
