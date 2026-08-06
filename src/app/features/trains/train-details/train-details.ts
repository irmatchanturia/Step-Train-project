import { SlicePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { TrainCoach, TrainDetailsModel, TrainSchedule } from '../models/train-details-models';

import { TrainService } from '../../registration/service/trains-service';

type TrainDetailsTab = 'schedules' | 'coaches';

@Component({
  selector: 'app-train-details',
  standalone: true,
  imports: [RouterLink, SlicePipe],
  templateUrl: './train-details.html',
  styleUrl: './train-details.css',
})
export class TrainDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly trainService = inject(TrainService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  private trainId: number | null = null;

  train: TrainDetailsModel | null = null;

  activeTab: TrainDetailsTab = 'schedules';

  isLoading = false;
  errorMessage = '';

  readonly loadingRows = [1, 2];

  coaches: TrainCoach[] = [];

  isCoachesLoading = false;
  coachesErrorMessage = '';

  private coachesLoaded = false;

  readonly currencySymbol = '₾';

  ngOnInit(): void {
    const idParameter = this.route.snapshot.paramMap.get('id');

    const trainId = Number(idParameter);

    if (!idParameter || !Number.isInteger(trainId) || trainId <= 0) {
      this.errorMessage = 'Invalid train ID.';
      return;
    }

    this.trainId = trainId;
    this.loadTrainDetails();
  }

  loadTrainDetails(): void {
    const trainId = this.trainId;

    if (trainId === null || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.trainService
      .getTrainById(trainId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.train = response.data;
          this.changeDetectorRef.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          console.error('Failed to load train details:', error);

          if (error.status === 404) {
            this.errorMessage = 'Train was not found.';
          } else if (error.status === 0) {
            this.errorMessage = 'Could not connect to the server.';
          } else {
            this.errorMessage = 'Train details could not be loaded. Please try again.';
          }

          this.changeDetectorRef.markForCheck();
        },
      });
  }

  selectTab(tab: TrainDetailsTab): void {
    this.activeTab = tab;

    if (tab === 'coaches' && !this.coachesLoaded && !this.isCoachesLoading) {
      this.loadCoaches();
    }
  }

  loadCoaches(): void {
    const trainId = this.trainId;

    if (trainId === null || this.isCoachesLoading) {
      return;
    }

    this.isCoachesLoading = true;
    this.coachesErrorMessage = '';

    this.trainService
      .getCoachesByTrainId(trainId, 10, 1)
      .pipe(
        finalize(() => {
          this.isCoachesLoading = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.coaches = response.data.items;
          this.coachesLoaded = true;

          this.changeDetectorRef.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          console.error('Failed to load train coaches:', error);

          if (error.status === 404) {
            this.coachesErrorMessage = 'Coaches were not found for this train.';
          } else {
            this.coachesErrorMessage = 'Coaches could not be loaded. Please try again.';
          }

          this.changeDetectorRef.markForCheck();
        },
      });
  }
  bookSchedule(schedule: TrainSchedule): void {
    console.log('Selected schedule:', schedule);

    /*
     * Booking wizard-ის შექმნის შემდეგ
     * აქ navigation დაემატება.
     *
     * მაგალითად:
     *
     * void this.router.navigate([
     *   '/trains',
     *   schedule.trainId,
     *   'book',
     *   schedule.id,
     *   'coach',
     * ]);
     */
  }
}
