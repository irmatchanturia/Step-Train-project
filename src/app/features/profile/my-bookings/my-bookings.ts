import { finalize } from 'rxjs';
import { Booking } from '../models/booking-models';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { BookingsService } from '../service/bookings-service';
import { RouterLink } from '@angular/router';
import { DatePipe, SlicePipe } from '@angular/common';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, SlicePipe],
  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.css',
})
export class MyBookings implements OnInit {
  readonly formBuilder = inject(FormBuilder);
  readonly bookingsService = inject(BookingsService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  readonly filterForm = this.formBuilder.nonNullable.group({
    fromDate: [''],
    toDate: [''],
  });

  allBookings: Booking[] = [];
  bookings: Booking[] = [];
  isLoading = false;
  errorMessage = '';
  deletingBookingId: number | null = null;

  readonly loadingItems = [1, 2, 3];

  ngOnInit(): void {
    this.loadBookings();
  }

  get hasActiveFilters(): boolean {
    const { fromDate, toDate } = this.filterForm.getRawValue();

    return Boolean(fromDate || toDate);
  }

  loadBookings(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.bookingsService
      .getBookings(10, 1)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.allBookings = response.data.items;
          this.bookings = [...this.allBookings];
        },
        error: (error) => {
          this.errorMessage = 'Your bookings could not be loaded. Please try again.';
        },
      });
  }

  applyFilters(): void {
    const { fromDate, toDate } = this.filterForm.getRawValue();

    if (fromDate && toDate && fromDate > toDate) {
      this.errorMessage = 'From date cannot be later than to date.';

      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.bookingsService
      .filterBookings(fromDate, toDate, 10, 1)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.bookings = response.data.items;
        },
        error: (error) => {
          console.error('Failed to filter bookings:', error);

          this.errorMessage = 'Bookings could not be filtered. Please try again.';
        },
      });
  }

  clearFilters(): void {
    this.filterForm.reset({
      fromDate: '',
      toDate: '',
    });

    this.errorMessage = '';
    this.bookings = [...this.allBookings];

    this.changeDetectorRef.markForCheck();
  }

  viewBookingDetails(bookingId: number): void {
    console.log('Booking details:', bookingId);
  }

  deleteBooking(bookingId: number): void {
    const shouldDelete = window.confirm('Are you sure you want to delete this booking?');

    if (!shouldDelete) {
      return;
    }

    this.deletingBookingId = bookingId;
    this.errorMessage = '';

    this.bookingsService
      .deleteBooking(bookingId)
      .pipe(
        finalize(() => {
          this.deletingBookingId = null;
        }),
      )
      .subscribe({
        next: () => {
          this.bookings = this.bookings.filter((booking) => booking.id !== bookingId);
        },
        error: (error) => {
          console.error('Failed to delete booking:', error);

          this.errorMessage = 'The booking could not be deleted. Please try again.';
        },
      });
  }
}
