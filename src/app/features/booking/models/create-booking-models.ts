export interface CreateBookingRequest {
  scheduleId: number;
  seatId: number[];
  travelDate: string;
}

export interface CreateBookingResponse {
  data: number;
  meta?: Record<string, string>;
}
