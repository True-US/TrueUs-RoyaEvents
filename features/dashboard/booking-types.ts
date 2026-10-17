export type AdminBookingEvent = {
  id: number;
  title: string;
  eventType: string;
  status: string;
  capacity: number | null;
  availableSpots: number | null;
  spotsPurchased: number;
  startDatetime: string;
  endDatetime: string | null;
  location: {
    name: string;
    address: string | null;
    city: string;
    province: string;
    country: string;
  } | null;
};

export type AdminEventBooking = {
  id: number;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  quantity: number;
  status: string;
  totalAmount: string;
  createdAt: string;
};

export type AdminEventBookingsPage = {
  bookings: AdminEventBooking[];
  page: number;
  pageSize: number;
  totalBookings: number;
  totalPages: number;
};

export const ADMIN_BOOKINGS_PAGE_SIZE = 10;
