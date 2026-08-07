import { SlicePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';
import { finalize, forkJoin } from 'rxjs';

import {
  SeatAvailability,
  TrainCoach,
  TrainDetailsModel,
  TrainSchedule,
} from '../../trains/models/train-details-models';

import { TrainService } from '../../registration/service/trains-service';
import { BookingsService } from '../../profile/service/bookings-service';
import { CreateBookingRequest } from '../../booking/models/create-booking-models';
import { BookingStateService } from '../service/booking-state';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [SlicePipe, TranslatePipe],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.css',
})
export class Confirmation implements OnInit {
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly trainService = inject(TrainService);

  private readonly bookingsService = inject(BookingsService);

  private readonly bookingStateService = inject(BookingStateService);

  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  private trainId: number | null = null;
  private scheduleId: number | null = null;
  private coachId: number | null = null;

  private selectedSeatIds: number[] = [];

  train: TrainDetailsModel | null = null;
  schedule: TrainSchedule | null = null;
  coach: TrainCoach | null = null;

  selectedSeats: SeatAvailability[] = [];

  travelDate = '';

  isLoading = false;
  isSubmitting = false;

  errorMessageKey = '';

  errorMessageParams: {
    seatNumber?: string;
  } = {};

  submitErrorMessageKey = '';

  bookingId: number | null = null;

  ngOnInit(): void {
    const parentRoute = this.route.parent;

    const trainIdParameter = parentRoute?.snapshot.paramMap.get('trainId');

    const scheduleIdParameter = parentRoute?.snapshot.paramMap.get('scheduleId');

    const trainId = Number(trainIdParameter);

    const scheduleId = Number(scheduleIdParameter);

    if (
      !trainIdParameter ||
      !scheduleIdParameter ||
      !Number.isInteger(trainId) ||
      !Number.isInteger(scheduleId) ||
      trainId <= 0 ||
      scheduleId <= 0
    ) {
      this.errorMessageKey = 'CONFIRMATION.ERRORS.INVALID_IDS';

      return;
    }

    this.trainId = trainId;
    this.scheduleId = scheduleId;

    this.bookingStateService.initializeJourney(trainId, scheduleId);

    const bookingDraft = this.bookingStateService.bookingDraft();

    if (bookingDraft.coachId === null) {
      void this.router.navigate(['../coach'], {
        relativeTo: this.route,
        replaceUrl: true,
      });

      return;
    }

    if (!bookingDraft.travelDate) {
      void this.router.navigate(['../date'], {
        relativeTo: this.route,
        replaceUrl: true,
      });

      return;
    }

    if (bookingDraft.seatIds.length === 0) {
      void this.router.navigate(['../seats'], {
        relativeTo: this.route,
        replaceUrl: true,
      });

      return;
    }

    this.coachId = bookingDraft.coachId;

    this.travelDate = bookingDraft.travelDate.slice(0, 10);

    this.selectedSeatIds = [...bookingDraft.seatIds];

    this.loadConfirmationData();
  }

  loadConfirmationData(): void {
    const trainId = this.trainId;

    const scheduleId = this.scheduleId;

    const coachId = this.coachId;

    if (
      trainId === null ||
      scheduleId === null ||
      coachId === null ||
      !this.travelDate ||
      this.isLoading
    ) {
      return;
    }

    this.isLoading = true;

    this.errorMessageKey = '';
    this.errorMessageParams = {};
    this.submitErrorMessageKey = '';

    forkJoin({
      trainResponse: this.trainService.getTrainById(trainId),

      coachesResponse: this.trainService.getCoachesByTrainId(trainId, 100, 1),

      seatsResponse: this.trainService.getSeatAvailability(scheduleId, coachId, this.travelDate),
    })
      .pipe(
        finalize(() => {
          this.isLoading = false;

          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: ({ trainResponse, coachesResponse, seatsResponse }) => {
          const train = trainResponse.data;

          const selectedSchedule =
            train.schedules.find((schedule) => schedule.id === scheduleId) ?? null;

          const selectedCoach =
            coachesResponse.data.items.find((coach) => coach.id === coachId) ?? null;

          if (!selectedSchedule) {
            this.errorMessageKey = 'CONFIRMATION.ERRORS.SCHEDULE_NOT_FOUND';

            this.changeDetectorRef.markForCheck();

            return;
          }

          if (!selectedCoach) {
            this.errorMessageKey = 'CONFIRMATION.ERRORS.COACH_NOT_FOUND';

            this.changeDetectorRef.markForCheck();

            return;
          }

          const selectedSeatIdSet = new Set(this.selectedSeatIds);

          const selectedSeats = seatsResponse.data.filter((seat) => selectedSeatIdSet.has(seat.id));

          if (selectedSeats.length !== this.selectedSeatIds.length) {
            this.errorMessageKey = 'CONFIRMATION.ERRORS.SEATS_NOT_FOUND';

            this.changeDetectorRef.markForCheck();

            return;
          }

          const unavailableSeat = selectedSeats.find((seat) => !seat.isAvailable);

          if (unavailableSeat) {
            this.errorMessageKey = 'CONFIRMATION.ERRORS.SEAT_UNAVAILABLE';

            this.errorMessageParams = {
              seatNumber: unavailableSeat.number,
            };

            this.changeDetectorRef.markForCheck();

            return;
          }

          this.train = train;

          this.schedule = selectedSchedule;

          this.coach = selectedCoach;

          this.selectedSeats = [...selectedSeats].sort((firstSeat, secondSeat) =>
            firstSeat.number.localeCompare(secondSeat.number, undefined, {
              numeric: true,
            }),
          );

          this.changeDetectorRef.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          console.error('Failed to load confirmation data:', error);

          if (error.status === 401) {
            this.errorMessageKey = 'CONFIRMATION.ERRORS.SESSION_EXPIRED';
          } else if (error.status === 404) {
            this.errorMessageKey = 'CONFIRMATION.ERRORS.BOOKING_INFO_NOT_FOUND';
          } else if (error.status === 0) {
            this.errorMessageKey = 'CONFIRMATION.ERRORS.SERVER_CONNECTION';
          } else {
            this.errorMessageKey = 'CONFIRMATION.ERRORS.LOAD_FAILED';
          }

          this.changeDetectorRef.markForCheck();
        },
      });
  }

  createBooking(): void {
    const scheduleId = this.scheduleId;

    if (
      scheduleId === null ||
      !this.travelDate ||
      this.selectedSeatIds.length === 0 ||
      this.isSubmitting ||
      this.bookingId !== null
    ) {
      return;
    }

    this.isSubmitting = true;

    this.submitErrorMessageKey = '';

    const request: CreateBookingRequest = {
      scheduleId,
      seatId: [...this.selectedSeatIds],
      travelDate: `${this.travelDate}T00:00:00`,
    };

    this.bookingsService
      .createBooking(request)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.bookingId = response.data;

          this.bookingStateService.clearDraft();

          this.changeDetectorRef.detectChanges();
        },

        error: (error: HttpErrorResponse) => {
          console.error('Failed to create booking:', error);

          if (error.status === 400) {
            this.submitErrorMessageKey = 'CONFIRMATION.ERRORS.INVALID_BOOKING';
          } else if (error.status === 401) {
            this.submitErrorMessageKey = 'CONFIRMATION.ERRORS.SESSION_EXPIRED';
          } else if (error.status === 409) {
            this.submitErrorMessageKey = 'CONFIRMATION.ERRORS.SEATS_NO_LONGER_AVAILABLE';
          } else if (error.status === 0) {
            this.submitErrorMessageKey = 'CONFIRMATION.ERRORS.SERVER_CONNECTION';
          } else {
            this.submitErrorMessageKey = 'CONFIRMATION.ERRORS.CREATE_FAILED';
          }

          this.changeDetectorRef.detectChanges();
        },
      });
  }

  backToSeats(): void {
    void this.router.navigate(['../seats'], {
      relativeTo: this.route,
    });
  }

  backToTrains(): void {
    void this.router.navigate(['/trains']);
  }

  get totalPrice(): number {
    if (!this.coach) {
      return 0;
    }

    return this.coach.price * this.selectedSeats.length;
  }
}
