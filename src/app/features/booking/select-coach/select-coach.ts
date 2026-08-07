import { SlicePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';

import { finalize, forkJoin } from 'rxjs';

import { TrainCoach, TrainSchedule } from '../../trains/models/train-details-models';

import { TrainService } from '../../registration/service/trains-service';
import { BookingStateService } from '../service/booking-state';

@Component({
  selector: 'app-select-coach',
  standalone: true,
  imports: [SlicePipe, TranslatePipe],
  templateUrl: './select-coach.html',
  styleUrl: './select-coach.css',
})
export class SelectCoach implements OnInit {
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly trainService = inject(TrainService);

  private readonly bookingStateService = inject(BookingStateService);

  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  private trainId: number | null = null;
  private scheduleId: number | null = null;

  schedule: TrainSchedule | null = null;

  coaches: TrainCoach[] = [];

  selectedCoachId: number | null = null;

  isLoading = false;

  errorMessageKey = '';

  readonly loadingItems = [1, 2, 3];

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
      this.errorMessageKey = 'SELECT_COACH.ERRORS.INVALID_IDS';

      return;
    }

    this.trainId = trainId;
    this.scheduleId = scheduleId;

    this.bookingStateService.initializeJourney(trainId, scheduleId);

    this.selectedCoachId = this.bookingStateService.bookingDraft().coachId;

    this.loadCoachSelectionData();
  }

  loadCoachSelectionData(): void {
    const trainId = this.trainId;

    const scheduleId = this.scheduleId;

    if (trainId === null || scheduleId === null || this.isLoading) {
      return;
    }

    this.isLoading = true;

    this.errorMessageKey = '';

    this.schedule = null;
    this.coaches = [];

    forkJoin({
      trainResponse: this.trainService.getTrainById(trainId),

      coachesResponse: this.trainService.getCoachesByTrainId(trainId, 10, 1),
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

          if (!selectedSchedule) {
            this.errorMessageKey = 'SELECT_COACH.ERRORS.SCHEDULE_NOT_FOUND';

            this.changeDetectorRef.markForCheck();

            return;
          }

          this.schedule = selectedSchedule;

          this.coaches = coachesResponse.data.items;

          if (
            this.selectedCoachId !== null &&
            !this.coaches.some((coach) => coach.id === this.selectedCoachId)
          ) {
            this.selectedCoachId = null;
          }

          this.changeDetectorRef.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          console.error('Failed to load coach selection data:', error);

          if (error.status === 404) {
            this.errorMessageKey = 'SELECT_COACH.ERRORS.NOT_FOUND';
          } else if (error.status === 0) {
            this.errorMessageKey = 'SELECT_COACH.ERRORS.SERVER_CONNECTION';
          } else {
            this.errorMessageKey = 'SELECT_COACH.ERRORS.LOAD_FAILED';
          }

          this.changeDetectorRef.markForCheck();
        },
      });
  }

  selectCoach(coachId: number): void {
    if (this.isLoading) {
      return;
    }

    this.selectedCoachId = coachId;

    this.bookingStateService.selectCoach(coachId);
  }

  continueToDate(): void {
    if (this.selectedCoachId === null) {
      return;
    }

    void this.router.navigate(['../date'], {
      relativeTo: this.route,
    });
  }

  get selectedCoach(): TrainCoach | null {
    if (this.selectedCoachId === null) {
      return null;
    }

    return this.coaches.find((coach) => coach.id === this.selectedCoachId) ?? null;
  }
}
