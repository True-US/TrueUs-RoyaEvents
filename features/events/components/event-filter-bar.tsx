import Link from "next/link";

import { EVENT_TABS } from "@/features/events/constants";
import { EventListControls } from "@/features/events/components/event-list-controls";
import {
  buildEventListHref,
  type EventListParams,
} from "@/features/events/search-params";

type EventFilterBarProps = {
  params: EventListParams;
  regions: string[];
};

/**
 * Date tabs plus the region and sort dropdowns. The tabs are plain links, so
 * this stays a Server Component; only the dropdowns need browser JavaScript.
 * @param props.params The current list params from the URL.
 * @param props.regions The regions that have events.
 * @returns The filter bar.
 */
export function EventFilterBar({ params, regions }: EventFilterBarProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-roya-slate/20 pb-4 lg:flex-row lg:items-center lg:justify-between">
      <nav aria-label="Filter events by date" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        <ul className="flex gap-2 whitespace-nowrap">
          {EVENT_TABS.map((tab: (typeof EVENT_TABS)[number]) => {
            // Flag for styling the active tab.
            const isActive: boolean = tab.value === params.tab;

            return (
              <li key={tab.value}>
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-block rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-roya-ink text-white"
                      : "bg-white text-roya-slate hover:bg-roya-sun hover:text-roya-ink"
                  }`}
                  // Switch the tab but keep the current region and sort.
                  href={buildEventListHref({ ...params, tab: tab.value })}
                  scroll={false}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <EventListControls params={params} regions={regions} />
    </div>
  );
}
