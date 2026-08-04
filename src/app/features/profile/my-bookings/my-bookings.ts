import { DatePipe, SlicePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { Booking, BookingsPage } from '../models/booking-models';
import { BookingsService } from '../service/bookings-service';

function dateRangeValidator(control: AbstractControl): ValidationErrors | null {
  const fromDate = control.get('fromDate')?.value as string;
  const toDate = control.get('toDate')?.value as string;

  if (fromDate && toDate && fromDate > toDate) {
    return {
      invalidDateRange: true,
    };
  }

  return null;
}

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, SlicePipe],
  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.css',
})
export class MyBookings implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly bookingsService = inject(BookingsService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  readonly filterForm = this.formBuilder.nonNullable.group(
    {
      fromDate: [''],
      toDate: [''],
    },
    {
      validators: dateRangeValidator,
    },
  );

  bookings: Booking[] = [];

  isLoading = false;
  errorMessage = '';
  deleteErrorMessage = '';

  deletingBookingId: number | null = null;

  currentPage = 1;
  totalPages = 1;
  totalCount = 0;
  hasMore = false;

  showDeleteConfirmation = false;
  selectedBookingId: number | null = null;

  readonly pageSize = 10;
  readonly loadingItems = [1, 2, 3];

  ngOnInit(): void {
    this.loadBookings(1);
  }

  get hasActiveFilters(): boolean {
    const { fromDate, toDate } = this.filterForm.getRawValue();

    return Boolean(fromDate || toDate);
  }

  loadBookings(page: number = 1): void {
    if (this.isLoading || page < 1) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.deleteErrorMessage = '';

    const { fromDate, toDate } = this.filterForm.getRawValue();

    const bookingsRequest = this.hasActiveFilters
      ? this.bookingsService.filterBookings(fromDate, toDate, this.pageSize, page)
      : this.bookingsService.getBookings(this.pageSize, page);

    bookingsRequest
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.updatePaginationState(response.data);

          this.changeDetectorRef.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          console.error('Failed to load bookings:', error);

          if (error.status === 401) {
            this.errorMessage = 'Your session has expired. Please sign in again.';
          } else {
            this.errorMessage = 'Your bookings could not be loaded. Please try again.';
          }

          this.changeDetectorRef.markForCheck();
        },
      });
  }

  applyFilters(): void {
    this.filterForm.markAllAsTouched();

    if (this.filterForm.invalid) {
      return;
    }

    this.currentPage = 1;
    this.loadBookings(1);
  }

  clearFilters(): void {
    if (this.isLoading) {
      return;
    }

    this.filterForm.reset({
      fromDate: '',
      toDate: '',
    });

    this.errorMessage = '';
    this.deleteErrorMessage = '';
    this.currentPage = 1;

    this.loadBookings(1);
  }

  goToPreviousPage(): void {
    if (this.currentPage <= 1 || this.isLoading) {
      return;
    }

    this.loadBookings(this.currentPage - 1);
  }

  goToNextPage(): void {
    if (!this.hasMore || this.isLoading) {
      return;
    }

    this.loadBookings(this.currentPage + 1);
  }

  goToPage(page: number): void {
    if (page === this.currentPage || page < 1 || page > this.totalPages || this.isLoading) {
      return;
    }

    this.loadBookings(page);
  }

  viewBookingDetails(bookingId: number): void {
    void this.router.navigate(['/profile/my-bookings', bookingId]);
  }

  openDeleteConfirmation(bookingId: number): void {
    if (this.deletingBookingId !== null) {
      return;
    }

    this.selectedBookingId = bookingId;
    this.errorMessage = '';
    this.showDeleteConfirmation = true;
  }

  closeDeleteConfirmation(): void {
    if (this.deletingBookingId !== null) {
      return;
    }

    this.showDeleteConfirmation = false;
    this.selectedBookingId = null;
  }

  confirmDeleteBooking(): void {
    const bookingId = this.selectedBookingId;

    if (bookingId === null || this.deletingBookingId !== null) {
      return;
    }

    this.deletingBookingId = bookingId;
    this.errorMessage = '';

    this.bookingsService
      .deleteBooking(bookingId)
      .pipe(
        finalize(() => {
          this.deletingBookingId = null;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.showDeleteConfirmation = false;
          this.selectedBookingId = null;

          this.totalCount = Math.max(0, this.totalCount - 1);

          const remainingBookings = this.bookings.filter((booking) => booking.id !== bookingId);

          if (remainingBookings.length === 0 && this.currentPage > 1) {
            this.loadBookings(this.currentPage - 1);
            return;
          }

          this.bookings = remainingBookings;

          this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));

          this.hasMore = this.currentPage < this.totalPages;

          this.changeDetectorRef.markForCheck();
        },

        error: () => {
          this.errorMessage = 'The booking could not be deleted. Please try again.';

          this.changeDetectorRef.markForCheck();
        },
      });
  }

  private updatePaginationState(page: BookingsPage): void {
    this.bookings = page.items;
    this.currentPage = page.currentPage;
    this.totalPages = Math.max(1, page.totalPages);
    this.totalCount = page.totalCount;
    this.hasMore = page.hasMore;
  }
}
