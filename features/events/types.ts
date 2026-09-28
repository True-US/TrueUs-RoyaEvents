export type Event = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  startsAt: string;
  location: string;
};
export type CreateEventLocationInput = {
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
  startDatetime: string;
  endDatetime?: string | null;
  capacity?: number | null;
  availableSpots?: number | null;
  eventType: string;
  status?: string;
  isActive?: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export type CreateEventWithLocationInput = {
  location: CreateEventLocationInput;
  event: CreateEventInput;
};
