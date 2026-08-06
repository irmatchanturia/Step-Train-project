export interface BookingDraft {
  trainId: number | null;
  scheduleId: number | null;
  coachId: number | null;
  travelDate: string | null;
  seatIds: number[];
}