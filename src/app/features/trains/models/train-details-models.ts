export interface TrainSchedule {
  id: number;
  origin: string;
  destination: string;
  departureTime: string;
  trainId: number;
  trainName: string;
  trainNumber: number;
}

export interface TrainDetailsModel {
  id: number;
  number: number;
  name: string;
  thumbnail: string | null;
  coachesCount: number;
  totalSeats: number;
  schedules: TrainSchedule[];
}

export interface TrainDetailsResponse {
  data: TrainDetailsModel;
}

export interface TrainCoach {
  id: number;
  number: number;
  class: string;
  price: number;
  trainId: number;
  seatCount: number;
}

export interface CoachesPage {
  items: TrainCoach[];
}

export interface CoachesResponse {
  data: CoachesPage;
}

export interface SeatAvailability {
  id: number;
  number: string;
  coachId: number;
  isAvailable: boolean;
}

export interface SeatAvailabilityResponse {
  data: SeatAvailability[];
}
export interface SeatAvailability {
  id: number;
  number: string;
  coachId: number;
  isAvailable: boolean;
}

export interface SeatAvailabilityResponse {
  data: SeatAvailability[];
}
