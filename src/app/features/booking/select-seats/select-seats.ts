import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { SeatAvailability, TrainCoach } from '../../trains/models/train-details-models';
import { TrainService } from '../../registration/service/trains-service';
import { BookingStateService } from '../service/booking-state';

@Component({
  selector: 'app-select-seats',
  standalone: true,
  imports: [],
  templateUrl: './select-seats.html',
  styleUrl: './select-seats.css',
})
export class SelectSeats implements OnInit {
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly trainService = inject(TrainService);

  private readonly bookingStateService = inject(BookingStateService);

  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  private trainId: number | null = null;
  private scheduleId: number | null = null;
  private coachId: number | null = null;

  private selectedSeatIds = new Set<number>();

  coach: TrainCoach | null = null;

  travelDate = '';

  seats: SeatAvailability[] = [];

  seatRows: SeatAvailability[][] = [];

  isLoading = false;
  errorMessage = '';
  selectionErrorMessage = '';

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

    this.coachId = bookingDraft.coachId;

    this.travelDate = bookingDraft.travelDate.slice(0, 10);

    this.selectedSeatIds = new Set(bookingDraft.seatIds);

    this.loadSeats();
  }

  loadSeats(): void {
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
    this.selectionErrorMessage = '';

    forkJoin({
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
        next: ({ coachesResponse, seatsResponse }) => {
          const selectedCoach =
            coachesResponse.data.items.find((coach) => coach.id === coachId) ?? null;

          if (!selectedCoach) {
            this.errorMessage = 'The selected coach was not found.';

            this.changeDetectorRef.markForCheck();

            return;
          }

          this.coach = selectedCoach;

          this.seats = this.sortSeats(seatsResponse.data);

          this.seatRows = this.createSeatRows(this.seats);

          /*
           * ადრე შენახული ადგილებიდან
           * ვტოვებთ მხოლოდ იმათ,
           * რომლებიც ახლაც თავისუფალია.
           */
          const availableSeatIds = new Set(
            this.seats.filter((seat) => seat.isAvailable).map((seat) => seat.id),
          );

          this.selectedSeatIds = new Set(
            [...this.selectedSeatIds].filter((seatId) => availableSeatIds.has(seatId)),
          );

          this.saveSelectedSeats();

          this.changeDetectorRef.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          console.error('Failed to load seats:', error);

          if (error.status === 400) {
            this.errorMessage = 'The selected journey, coach or date is invalid.';
          } else if (error.status === 401) {
            this.errorMessage = 'Your session has expired. Please sign in again.';
          } else if (error.status === 404) {
            this.errorMessage = 'Seats were not found for this coach.';
          } else if (error.status === 0) {
            this.errorMessage = 'Could not connect to the server.';
          } else {
            this.errorMessage = 'Seats could not be loaded. Please try again.';
          }

          this.changeDetectorRef.markForCheck();
        },
      });
  }

  toggleSeat(seat: SeatAvailability): void {
    if (!seat.isAvailable) {
      return;
    }

    this.selectionErrorMessage = '';

    const updatedSeatIds = new Set(this.selectedSeatIds);

    if (updatedSeatIds.has(seat.id)) {
      updatedSeatIds.delete(seat.id);
    } else {
      updatedSeatIds.add(seat.id);
    }

    this.selectedSeatIds = updatedSeatIds;

    this.saveSelectedSeats();

    this.changeDetectorRef.markForCheck();
  }

  isSeatSelected(seatId: number): boolean {
    return this.selectedSeatIds.has(seatId);
  }

  backToDate(): void {
    void this.router.navigate(['../date'], {
      relativeTo: this.route,
    });
  }

  continueToConfirmation(): void {
    if (this.selectedSeatIds.size === 0) {
      this.selectionErrorMessage = 'Please select at least one seat.';

      this.changeDetectorRef.markForCheck();
      return;
    }

    const trainId = this.trainId;
    const scheduleId = this.scheduleId;

    if (trainId === null || scheduleId === null) {
      this.selectionErrorMessage = 'Invalid booking information.';

      this.changeDetectorRef.markForCheck();
      return;
    }

    this.saveSelectedSeats();

    void this.router.navigate(['/trains', trainId, 'book', scheduleId, 'confirmation']);
  }

  get selectedSeats(): SeatAvailability[] {
    return this.seats.filter((seat) => this.selectedSeatIds.has(seat.id));
  }

  get selectedSeatsCount(): number {
    return this.selectedSeatIds.size;
  }

  get totalPrice(): number {
    if (!this.coach) {
      return 0;
    }

    return this.coach.price * this.selectedSeatsCount;
  }

  private saveSelectedSeats(): void {
    this.bookingStateService.selectSeats([...this.selectedSeatIds]);
  }

  private sortSeats(seats: SeatAvailability[]): SeatAvailability[] {
    return [...seats].sort((firstSeat, secondSeat) => {
      const first = this.parseSeatNumber(firstSeat.number);

      const second = this.parseSeatNumber(secondSeat.number);

      if (first.row !== second.row) {
        return first.row - second.row;
      }

      return first.column.localeCompare(second.column);
    });
  }

  private parseSeatNumber(seatNumber: string): {
    row: number;
    column: string;
  } {
    const match = seatNumber.match(/^(\d+)([a-zA-Z]+)$/);

    if (!match) {
      return {
        row: Number.MAX_SAFE_INTEGER,
        column: seatNumber,
      };
    }

    return {
      row: Number(match[1]),
      column: match[2].toUpperCase(),
    };
  }

  private createSeatRows(seats: SeatAvailability[]): SeatAvailability[][] {
    const rows: SeatAvailability[][] = [];

    for (let index = 0; index < seats.length; index += 4) {
      rows.push(seats.slice(index, index + 4));
    }

    return rows;
  }
}
