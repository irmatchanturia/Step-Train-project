import { SlicePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';

import { TrainCoach, TrainDetailsModel, TrainSchedule } from '../models/train-details-models';

import { TrainService } from '../../registration/service/trains-service';
import { AuthService } from '../../registration/service/auth';

type TrainDetailsTab = 'schedules' | 'coaches';

@Component({
  selector: 'app-train-details',
  standalone: true,
  imports: [RouterLink, SlicePipe, TranslatePipe],
  templateUrl: './train-details.html',
  styleUrl: './train-details.css',
})
export class TrainDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly trainService = inject(TrainService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  private trainId: number | null = null;
  private pendingBookingUrl: string | null = null;
  private coachesLoaded = false;

  train: TrainDetailsModel | null = null;

  activeTab: TrainDetailsTab = 'schedules';

  isLoading = false;
  errorMessageKey = '';

  readonly loadingRows = [1, 2];

  coaches: TrainCoach[] = [];

  isCoachesLoading = false;
  coachesErrorMessageKey = '';

  showAuthenticationModal = false;

  readonly currencySymbol = '₾';

  ngOnInit(): void {
    const idParameter = this.route.snapshot.paramMap.get('id');

    const trainId = Number(idParameter);

    if (!idParameter || !Number.isInteger(trainId) || trainId <= 0) {
      this.errorMessageKey = 'TRAIN_DETAILS.ERRORS.INVALID_ID';

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
    this.errorMessageKey = '';

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
            this.errorMessageKey = 'TRAIN_DETAILS.ERRORS.TRAIN_NOT_FOUND';
          } else if (error.status === 0) {
            this.errorMessageKey = 'TRAIN_DETAILS.ERRORS.SERVER_CONNECTION';
          } else {
            this.errorMessageKey = 'TRAIN_DETAILS.ERRORS.TRAIN_LOAD_FAILED';
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
    this.coachesErrorMessageKey = '';

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
            this.coachesErrorMessageKey = 'TRAIN_DETAILS.ERRORS.COACHES_NOT_FOUND';
          } else {
            this.coachesErrorMessageKey = 'TRAIN_DETAILS.ERRORS.COACHES_LOAD_FAILED';
          }

          this.changeDetectorRef.markForCheck();
        },
      });
  }

  bookSchedule(schedule: TrainSchedule): void {
    if (!this.train) {
      return;
    }

    const bookingUrl = `/trains/${this.train.id}/book/${schedule.id}/coach`;

    const isAuthenticated = Boolean(this.authService.getAccessToken());

    if (!isAuthenticated) {
      this.pendingBookingUrl = bookingUrl;
      this.showAuthenticationModal = true;

      return;
    }

    void this.router.navigateByUrl(bookingUrl);
  }

  closeAuthenticationModal(): void {
    this.showAuthenticationModal = false;
    this.pendingBookingUrl = null;
  }

  goToSignIn(): void {
    const returnUrl = this.pendingBookingUrl ?? '/trains';

    this.showAuthenticationModal = false;

    void this.router.navigate(['/sign-in'], {
      queryParams: {
        returnUrl,
      },
    });
  }
}
