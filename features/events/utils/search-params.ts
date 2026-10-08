import {
  EVENT_SORTS,
  EVENT_TABS,
  type EventSort,
  type EventTab,
} from "@/features/events/constants";

// Reads and writes the /events URL: ?when=this-week&region=Edmonton&sort=price-low
// No Prisma or server imports here, so Client Components can use it too.

// Everything that decides which events are listed and in what order.
export type EventListParams = {
  tab: EventTab;
  region: string | null; // A city name, or null for all regions.
  sort: EventSort;
};

// Values used when the URL has no (or an invalid) parameter.
export const DEFAULT_EVENT_LIST_PARAMS: EventListParams = {
  tab: "all",
  region: null,
  sort: "date",
};

// Raw value of one search param as Next.js provides it.
type SearchParamValue = string | string[] | undefined;

/**
 * Reads the /events search params, replacing anything unknown with the default.
 * @param searchParams The page's resolved searchParams.
 * @param regions The regions that currently have events; any other region is ignored.
 * @returns Valid list params.
 */
export function parseEventListParams(
  searchParams: Record<string, SearchParamValue>,
  regions: string[],
): EventListParams {
  return {
    tab: parseOption(searchParams.when, EVENT_TABS, DEFAULT_EVENT_LIST_PARAMS.tab),
    region: parseRegion(searchParams.region, regions),
    sort: parseOption(searchParams.sort, EVENT_SORTS, DEFAULT_EVENT_LIST_PARAMS.sort),
  };
}

/**
 * Builds the /events URL for some params, leaving out default values so
 * the plain list stays at "/events".
 * @param params The list params to encode.
 * @returns A relative URL such as "/events?when=free&sort=price-low".
 */
export function buildEventListHref(params: EventListParams): string {
  const query: URLSearchParams = new URLSearchParams();

  if (params.tab !== DEFAULT_EVENT_LIST_PARAMS.tab) {
    query.set("when", params.tab);
  }
  if (params.region) {
    query.set("region", params.region);
  }
  if (params.sort !== DEFAULT_EVENT_LIST_PARAMS.sort) {
    query.set("sort", params.sort);
  }

  const queryString: string = query.toString();
  if (!queryString) {
    return "/events";
  }

  return `/events?${queryString}`;
}

/**
 * Checks whether any filter or sort differs from the default.
 * @param params The current list params.
 * @returns True when the visitor has narrowed or reordered the list.
 */
export function hasActiveFilters(params: EventListParams): boolean {
  return buildEventListHref(params) !== "/events";
}

/**
 * Picks the option whose value matches the param.
 * @param value The raw search param.
 * @param options The allowed options, e.g. EVENT_TABS.
 * @param fallback The value to use when the param is missing or unknown.
 * @returns The matching option value, or the fallback.
 */
function parseOption<T extends string>(
  value: SearchParamValue,
  options: readonly { value: T }[],
  fallback: T,
): T {
  // typeof also rules out undefined and repeated params (string[]).
  if (typeof value !== "string") {
    return fallback;
  }

  const match: { value: T } | undefined = options.find(
    (option: { value: T }) => option.value === value,
  );
  if (!match) {
    return fallback;
  }

  return match.value;
}

/**
 * Accepts the region param only if it is one of the known regions.
 * @param value The raw search param.
 * @param regions The regions that currently have events.
 * @returns The region, or null for all regions.
 */
function parseRegion(value: SearchParamValue, regions: string[]): string | null {
  if (typeof value !== "string") {
    return null;
  }
  if (!regions.includes(value)) {
    return null;
  }

  return value;
}
