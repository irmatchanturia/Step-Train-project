import { DatePipe, SlicePipe } from '@angular/common';

import { HttpErrorResponse } from '@angular/common/http';

import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';

import { finalize } from 'rxjs';

import { BookingDetailsModel } from '../models/booking-models';
import { BookingsService } from '../service/bookings-service';

@Component({
  selector: 'app-booking-details',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, SlicePipe, TranslatePipe],
  templateUrl: './booking-details.html',
  styleUrl: './booking-details.css',
})
export class BookingDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly bookingsService = inject(BookingsService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  private bookingId: number | null = null;

  readonly changeDateForm = this.formBuilder.nonNullable.group({
    travelDate: ['', Validators.required],
  });

  booking: BookingDetailsModel | null = null;

  isLoading = false;
  isChangingDate = false;
  isUpdatingDate = false;
  isDeletingBooking = false;
  showDeleteConfirmation = false;

  errorMessageKey = '';
  dateSuccessMessageKey = '';
  dateErrorMessageKey = '';
  deleteErrorMessageKey = '';

  readonly loadingRows = [1, 2, 3, 4, 5, 6, 7];

  readonly currencySymbol = '₾';

  readonly minimumTravelDate = this.formatLocalDateForInput(new Date());

  ngOnInit(): void {
    const idParameter = this.route.snapshot.paramMap.get('id');

    const bookingId = Number(idParameter);

    if (!idParameter || !Number.isInteger(bookingId) || bookingId <= 0) {
      this.errorMessageKey = 'BOOKING_DETAILS.MESSAGES.INVALID_ID';

      return;
    }

    this.bookingId = bookingId;

    this.loadBooking();
  }

  loadBooking(): void {
    const bookingId = this.bookingId;

    if (bookingId === null || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessageKey = '';

    this.bookingsService
      .getBookingById(bookingId)
      .pipe(
        finalize(() => {
          this.isLoading = false;

          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.booking = response.data;

          this.changeDateForm.patchValue({
            travelDate: this.formatDateForInput(response.data.travelDate),
          });

          this.changeDetectorRef.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.errorMessageKey = 'BOOKING_DETAILS.MESSAGES.BOOKING_NOT_FOUND';
          } else if (error.status === 401) {
            this.errorMessageKey = 'BOOKING_DETAILS.MESSAGES.SESSION_EXPIRED';
          } else {
            this.errorMessageKey = 'BOOKING_DETAILS.MESSAGES.LOAD_FAILED';
          }

          this.changeDetectorRef.markForCheck();
        },
      });
  }

  openChangeDateEditor(): void {
    if (this.isUpdatingDate || this.isDeletingBooking || !this.booking) {
      return;
    }

    this.isChangingDate = true;

    this.dateSuccessMessageKey = '';
    this.dateErrorMessageKey = '';

    this.changeDateForm.patchValue({
      travelDate: this.formatDateForInput(this.booking.travelDate),
    });
  }

  closeChangeDateEditor(): void {
    if (this.isUpdatingDate) {
      return;
    }

    this.isChangingDate = false;
    this.dateErrorMessageKey = '';

    if (this.booking) {
      this.changeDateForm.patchValue({
        travelDate: this.formatDateForInput(this.booking.travelDate),
      });
    }
  }

  saveTravelDate(): void {
    const bookingId = this.bookingId;
    const currentBooking = this.booking;

    if (
      this.changeDateForm.invalid ||
      bookingId === null ||
      !currentBooking ||
      this.isUpdatingDate
    ) {
      this.changeDateForm.markAllAsTouched();

      return;
    }

    const selectedDate = this.changeDateForm.controls.travelDate.value;

    const formattedTravelDate = this.formatDateForBackend(selectedDate);

    this.isUpdatingDate = true;

    this.dateSuccessMessageKey = '';
    this.dateErrorMessageKey = '';

    this.bookingsService
      .updateBookingDate(bookingId, {
        travelDate: formattedTravelDate,
      })
      .pipe(
        finalize(() => {
          this.isUpdatingDate = false;

          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.booking = {
            ...currentBooking,
            travelDate: formattedTravelDate,
          };

          this.isChangingDate = false;

          this.dateSuccessMessageKey = 'BOOKING_DETAILS.MESSAGES.DATE_UPDATED';

          this.changeDetectorRef.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.dateErrorMessageKey = 'BOOKING_DETAILS.MESSAGES.BOOKING_NOT_FOUND';
          } else if (error.status === 400) {
            this.dateErrorMessageKey = 'BOOKING_DETAILS.MESSAGES.INVALID_DATE';
          } else if (error.status === 401) {
            this.dateErrorMessageKey = 'BOOKING_DETAILS.MESSAGES.SESSION_EXPIRED';
          } else {
            this.dateErrorMessageKey = 'BOOKING_DETAILS.MESSAGES.DATE_UPDATE_FAILED';
          }

          this.changeDetectorRef.markForCheck();
        },
      });
  }

  openDeleteConfirmation(): void {
    if (this.bookingId === null || this.isDeletingBooking || this.isUpdatingDate) {
      return;
    }

    this.isChangingDate = false;
    this.deleteErrorMessageKey = '';
    this.showDeleteConfirmation = true;
  }

  closeDeleteConfirmation(): void {
    if (this.isDeletingBooking) {
      return;
    }

    this.showDeleteConfirmation = false;
    this.deleteErrorMessageKey = '';
  }

  confirmDeleteBooking(): void {
    const bookingId = this.bookingId;

    if (bookingId === null || this.isDeletingBooking) {
      return;
    }

    this.isDeletingBooking = true;
    this.deleteErrorMessageKey = '';

    this.bookingsService
      .deleteBooking(bookingId)
      .pipe(
        finalize(() => {
          this.isDeletingBooking = false;

          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.showDeleteConfirmation = false;
          this.isDeletingBooking = false;

          this.changeDetectorRef.detectChanges();

          void this.router.navigate(['/profile/my-bookings'], {
            replaceUrl: true,
          });
        },

        error: (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.deleteErrorMessageKey = 'BOOKING_DETAILS.MESSAGES.DELETE_NOT_FOUND';
          } else if (error.status === 401) {
            this.deleteErrorMessageKey = 'BOOKING_DETAILS.MESSAGES.SESSION_EXPIRED';
          } else {
            this.deleteErrorMessageKey = 'BOOKING_DETAILS.MESSAGES.DELETE_FAILED';
          }

          this.changeDetectorRef.markForCheck();
        },
      });
  }

  private formatDateForInput(date: string | null | undefined): string {
    if (!date) {
      return '';
    }

    return date.slice(0, 10);
  }

  private formatDateForBackend(date: string): string {
    return `${date}T00:00:00.000Z`;
  }

  private formatLocalDateForInput(date: Date): string {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');

    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
