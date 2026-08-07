import { SlicePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';

import { finalize, forkJoin } from 'rxjs';

import { TrainCoach, TrainSchedule } from '../../trains/models/train-details-models';

import { TrainService } from '../../registration/service/trains-service';
import { BookingStateService } from '../service/booking-state';

@Component({
  selector: 'app-select-date',
  standalone: true,
  imports: [ReactiveFormsModule, SlicePipe, TranslatePipe],
  templateUrl: './select-date.html',
  styleUrl: './select-date.css',
})
export class SelectDate implements OnInit {
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly formBuilder = inject(FormBuilder);

  private readonly trainService = inject(TrainService);

  private readonly bookingStateService = inject(BookingStateService);

  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  private trainId: number | null = null;
  private scheduleId: number | null = null;
  private coachId: number | null = null;

  readonly dateForm = this.formBuilder.nonNullable.group({
    travelDate: ['', Validators.required],
  });

  schedule: TrainSchedule | null = null;
  coach: TrainCoach | null = null;

  isLoading = false;

  errorMessageKey = '';
  dateErrorMessageKey = '';

  readonly minimumTravelDate = this.formatLocalDate(new Date());

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
      this.errorMessageKey = 'SELECT_DATE.ERRORS.INVALID_IDS';

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

    this.coachId = bookingDraft.coachId;

    const storedTravelDate = bookingDraft.travelDate?.slice(0, 10) ?? '';

    if (storedTravelDate && !this.isPastDate(storedTravelDate)) {
      this.dateForm.controls.travelDate.setValue(storedTravelDate);
    } else if (storedTravelDate) {
      this.bookingStateService.clearTravelDate();
    }

    this.loadDateSelectionData();
  }

  loadDateSelectionData(): void {
    const trainId = this.trainId;

    const scheduleId = this.scheduleId;

    const coachId = this.coachId;

    if (trainId === null || scheduleId === null || coachId === null || this.isLoading) {
      return;
    }

    this.isLoading = true;

    this.errorMessageKey = '';
    this.dateErrorMessageKey = '';

    forkJoin({
      trainResponse: this.trainService.getTrainById(trainId),

      coachesResponse: this.trainService.getCoachesByTrainId(trainId, 100, 1),
    })
      .pipe(
        finalize(() => {
          this.isLoading = false;

          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: ({ trainResponse, coachesResponse }) => {
          const selectedSchedule =
            trainResponse.data.schedules.find((schedule) => schedule.id === scheduleId) ?? null;

          const selectedCoach =
            coachesResponse.data.items.find((coach) => coach.id === coachId) ?? null;

          if (!selectedSchedule) {
            this.errorMessageKey = 'SELECT_DATE.ERRORS.SCHEDULE_NOT_FOUND';

            this.changeDetectorRef.markForCheck();

            return;
          }

          if (!selectedCoach) {
            this.errorMessageKey = 'SELECT_DATE.ERRORS.COACH_NOT_FOUND';

            this.changeDetectorRef.markForCheck();

            return;
          }

          this.schedule = selectedSchedule;

          this.coach = selectedCoach;

          this.changeDetectorRef.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          console.error('Failed to load date selection data:', error);

          if (error.status === 404) {
            this.errorMessageKey = 'SELECT_DATE.ERRORS.NOT_FOUND';
          } else if (error.status === 401) {
            this.errorMessageKey = 'SELECT_DATE.ERRORS.SESSION_EXPIRED';
          } else if (error.status === 0) {
            this.errorMessageKey = 'SELECT_DATE.ERRORS.SERVER_CONNECTION';
          } else {
            this.errorMessageKey = 'SELECT_DATE.ERRORS.LOAD_FAILED';
          }

          this.changeDetectorRef.markForCheck();
        },
      });
  }

  backToCoach(): void {
    void this.router.navigate(['../coach'], {
      relativeTo: this.route,
    });
  }

  continueToSeats(): void {
    this.dateErrorMessageKey = '';

    if (this.dateForm.invalid) {
      this.dateForm.markAllAsTouched();

      this.dateErrorMessageKey = 'SELECT_DATE.FORM.DATE_REQUIRED';

      return;
    }

    const selectedDate = this.dateForm.controls.travelDate.value;

    if (!this.isValidIsoDate(selectedDate)) {
      this.dateErrorMessageKey = 'SELECT_DATE.ERRORS.VALID_DATE_REQUIRED';

      return;
    }

    if (this.isPastDate(selectedDate)) {
      this.dateErrorMessageKey = 'SELECT_DATE.ERRORS.PAST_DATE';

      return;
    }

    this.bookingStateService.selectTravelDate(selectedDate);

    void this.router.navigate(['../seats'], {
      relativeTo: this.route,
    });
  }

  private isValidIsoDate(value: string): boolean {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) {
      return false;
    }

    const year = Number(match[1]);

    const month = Number(match[2]);

    const day = Number(match[3]);

    const date = new Date(year, month - 1, day);

    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }

  private isPastDate(isoDate: string): boolean {
    if (!this.isValidIsoDate(isoDate)) {
      return true;
    }

    const [year, month, day] = isoDate.split('-').map(Number);

    const selectedDate = new Date(year, month - 1, day);

    const today = new Date();

    const selectedTimestamp = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
    ).getTime();

    const todayTimestamp = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    ).getTime();

    return selectedTimestamp < todayTimestamp;
  }

  private formatLocalDate(date: Date): string {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');

    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
