export type ScheduleCalendarItem = {
  id: number;
  title: string;
  slug: string;
  eventType: string;
  status: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
};
