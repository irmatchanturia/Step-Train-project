import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Station {
  id: number;
  name: string;
}
export interface TrainSummary {
  trainId: number;
  trainNumber: number;
  name: string;
  coachesCount: number;
  totalSeats: number;
}

interface FilterTrainsResponse {
  data: {
    items: Array<{
      id: number;
      number: number;
      name: string;
      coachesCount: number;
      totalSeats: number;
    }>;
  };
}

interface StationsResponse {
  data: Station[];
}
export interface TrainSchedule {
  id: number;
  origin: string;
  destination: string;
  departureTime: string;
}

export interface TrainCoach {
  id: number;
  number: number;
  coachClass: string;
  price: number;
  seatCount: number;
}

export interface TrainDetails {
  id: number;
  number: number;
  name: string;
  schedules: TrainSchedule[];
  coaches: TrainCoach[];
}

interface TrainDetailsResponse {
  data: {
    id: number;
    number: number;
    name: string;

    schedules: Array<{
      id: number;
      origin: string;
      destination: string;
      departureTime: string;
    }>;

    coaches: Array<{
      id: number;
      number: number;
      class: string;
      price: number;
      seatCount: number;
    }>;
  };
}
export interface AvailableSeat {
  id: number;
  number: string;
}

interface SeatAvailabilityResponse {
  data: Array<{
    id: number;
    number: string;
    coachId: number;
    isAvailable: boolean;
  }>;
}

@Injectable()
export class StepApiService {
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const baseUrl = this.configService.get<string>('STEP_API_BASE_URL');

    if (!baseUrl) {
      throw new Error('STEP_API_BASE_URL is not configured');
    }

    this.baseUrl = baseUrl;
  }

  async getStations(): Promise<Station[]> {
    try {
      const response = await fetch(`${this.baseUrl}/stations`);

      if (!response.ok) {
        throw new Error(`STEP API returned ${response.status}`);
      }

      const responseData = (await response.json()) as StationsResponse;

      return responseData.data.map((station) => ({
        id: station.id,
        name: station.name,
      }));
    } catch (error) {
      console.error('Failed to load stations from STEP API:', error);

      throw new InternalServerErrorException('Unable to load stations');
    }
  }
  async filterTrains(
    origin: string,
    destination: string,
  ): Promise<TrainSummary[]> {
    try {
      const params = new URLSearchParams();

      if (origin.trim()) {
        params.set('origin', origin.trim());
      }

      if (destination.trim()) {
        params.set('destination', destination.trim());
      }

      const response = await fetch(
        `${this.baseUrl}/trains/filter?${params.toString()}`,
      );

      if (!response.ok) {
        throw new Error(`STEP API returned ${response.status}`);
      }

      const responseData = (await response.json()) as FilterTrainsResponse;

      return responseData.data.items.map((train) => ({
        trainId: train.id,
        trainNumber: train.number,
        name: train.name,
        coachesCount: train.coachesCount,
        totalSeats: train.totalSeats,
      }));
    } catch (error) {
      console.error('Failed to filter trains from STEP API:', error);

      throw new InternalServerErrorException('Unable to search trains');
    }
  }
  async getTrainDetails(trainId: number): Promise<TrainDetails> {
    try {
      const response = await fetch(`${this.baseUrl}/trains/${trainId}`);

      if (!response.ok) {
        throw new Error(`STEP API returned ${response.status}`);
      }

      const responseData = (await response.json()) as TrainDetailsResponse;

      return {
        id: responseData.data.id,
        number: responseData.data.number,
        name: responseData.data.name,

        schedules: responseData.data.schedules.map((schedule) => ({
          id: schedule.id,
          origin: schedule.origin,
          destination: schedule.destination,
          departureTime: schedule.departureTime,
        })),

        coaches: responseData.data.coaches.map((coach) => ({
          id: coach.id,
          number: coach.number,
          coachClass: coach.class,
          price: coach.price,
          seatCount: coach.seatCount,
        })),
      };
    } catch (error) {
      console.error('Failed to load train details from STEP API:', error);

      throw new InternalServerErrorException('Unable to load train details');
    }
  }
  async getAvailableSeats(
    scheduleId: number,
    coachId: number,
    travelDate: string,
  ): Promise<AvailableSeat[]> {
    try {
      const formattedTravelDate = travelDate.includes('T')
        ? travelDate
        : `${travelDate}T00:00:00`;

      const params = new URLSearchParams({
        scheduleId: scheduleId.toString(),
        coachId: coachId.toString(),
        travelDate: formattedTravelDate,
      });

      const response = await fetch(
        `${this.baseUrl}/seats/availability?${params.toString()}`,
      );

      if (!response.ok) {
        throw new Error(`STEP API returned ${response.status}`);
      }

      const responseData = (await response.json()) as SeatAvailabilityResponse;

      return responseData.data
        .filter((seat) => seat.isAvailable)
        .map((seat) => ({
          id: seat.id,
          number: seat.number,
        }));
    } catch (error) {
      console.error('Failed to load seat availability from STEP API:', error);

      throw new InternalServerErrorException(
        'Unable to load seat availability',
      );
    }
  }
}
