export interface Booking {
  id: number;
  travelDate: string;
  scheduleId: number;
  origin: string;
  destination: string;
  departureTime: string;
  price: number;
  seatId: number;
  seatNumber: string;
  coachNumber: number;
  coachClass: string;
  trainNumber: number;
  trainName: string;
  createdAt: string;
}

export interface BookingsPage {
  items: Booking[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasMore: boolean;
}

export interface BookingsResponse {
  data: BookingsPage;
}
