import { SlicePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  imports: [SlicePipe],
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

  errorMessage = '';
  submitErrorMessage = '';

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
      this.errorMessage = 'Invalid train or schedule ID.';

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
    this.errorMessage = '';
    this.submitErrorMessage = '';

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
            this.errorMessage = 'The selected schedule was not found.';

            this.changeDetectorRef.markForCheck();

            return;
          }

          if (!selectedCoach) {
            this.errorMessage = 'The selected coach was not found.';

            this.changeDetectorRef.markForCheck();

            return;
          }

          const selectedSeatIdSet = new Set(this.selectedSeatIds);

          const selectedSeats = seatsResponse.data.filter((seat) => selectedSeatIdSet.has(seat.id));

          if (selectedSeats.length !== this.selectedSeatIds.length) {
            this.errorMessage =
              'One or more selected seats could not be found. Please select your seats again.';

            this.changeDetectorRef.markForCheck();

            return;
          }

          const unavailableSeat = selectedSeats.find((seat) => !seat.isAvailable);

          if (unavailableSeat) {
            this.errorMessage = `Seat ${unavailableSeat.number} is no longer available. Please select another seat.`;

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
            this.errorMessage = 'Your session has expired. Please sign in again.';
          } else if (error.status === 404) {
            this.errorMessage = 'Booking information could not be found.';
          } else if (error.status === 0) {
            this.errorMessage = 'Could not connect to the server.';
          } else {
            this.errorMessage = 'Booking information could not be loaded. Please try again.';
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
    this.submitErrorMessage = '';

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

          /*
           * Success გვერდს მაშინვე დახატავს.
           */
          this.changeDetectorRef.detectChanges();
        },

        error: (error: HttpErrorResponse) => {
          console.error('Failed to create booking:', error);

          if (error.status === 400) {
            this.submitErrorMessage = 'The selected booking information is invalid.';
          } else if (error.status === 401) {
            this.submitErrorMessage = 'Your session has expired. Please sign in again.';
          } else if (error.status === 409) {
            this.submitErrorMessage = 'One or more selected seats are no longer available.';
          } else if (error.status === 0) {
            this.submitErrorMessage = 'Could not connect to the server.';
          } else {
            this.submitErrorMessage = 'Your booking could not be created. Please try again.';
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
