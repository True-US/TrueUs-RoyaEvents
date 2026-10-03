export type Event = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  startsAt: string;
  location: string;
};

/**
 * This type is only for the Admin Manage Events page.
 * It does not replace the customer Event type above.
 */
export type AdminEvent = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  price: number | string | null;
  startsAt: string;
  endsAt: string | null;
  status: string;
  capacity: number | null;
  availableSpots: number | null;
  eventType: string;
  isActive: boolean;
  location: {
    id: number;
    name: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  } | null;
};


export type CreateEventLocationInput = {
  name: string;
  address?: string | null;
  city: string;
  province: string;
  postalCode?: string | null;
  country: string;
};

export type UpdateEventLocationInput = {
  id: number;
  name: string;
  address?: string | null;
  city: string;
  province: string;
  postalCode?: string | null;
  country: string;
};

export type CreateEventInput = {
  title: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  price?: number | null;
  startDatetime: string;
  endDatetime?: string | null;
  capacity?: number | null;
  availableSpots?: number | null;
  eventType?: string;
  status?: string;
  isActive?: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export type CreateEventWithLocationInput = {
  location: CreateEventLocationInput;
  event: CreateEventInput;
};

export type UpdateEventWithLocationInput = {
  id: number;
  location: UpdateEventLocationInput;
  event: CreateEventInput;
};

