import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { Train } from '../../../registration/models/trains.models';
import { Station } from '../../../registration/models/stations.model';
import { TrainService } from '../../../registration/service/trains-service';

@Component({
  selector: 'app-train',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './train.html',
  styleUrl: './train.css',
})
export class TrainComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly trainService = inject(TrainService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  stations: Station[] = [];
  allTrains: Train[] = [];
  filteredTrains: Train[] = [];

  errorMessageKey = '';
  isLoading = true;

  filtersForm = new FormGroup({
    trainNumber: new FormControl('', {
      nonNullable: true,
    }),

    destination: new FormControl('', {
      nonNullable: true,
    }),

    origin: new FormControl('', {
      nonNullable: true,
    }),
  });

  ngOnInit(): void {
    this.loadStations();
    this.loadTrains();
  }

  loadStations(): void {
    this.trainService.getStations().subscribe({
      next: (response) => {
        this.stations = response.data;

        this.changeDetector.markForCheck();
      },
    });
  }

  loadTrains(): void {
    this.isLoading = true;
    this.errorMessageKey = '';

    this.trainService.getTrains().subscribe({
      next: (response) => {
        this.allTrains = response.data.items;
        this.filteredTrains = response.data.items;

        this.isLoading = false;

        this.changeDetector.markForCheck();
      },

      error: () => {
        this.errorMessageKey = 'TRAINS.ERRORS.LOAD_FAILED';

        this.isLoading = false;

        this.changeDetector.markForCheck();
      },
    });
  }

  clearFilters(): void {
    this.filtersForm.reset();

    this.filteredTrains = this.allTrains;

    this.errorMessageKey = '';
    this.isLoading = false;
  }

  applyFilters(): void {
    const formValues = this.filtersForm.getRawValue();

    const trainNumber = formValues.trainNumber.trim();

    const origin = formValues.origin.trim();

    const destination = formValues.destination.trim();

    this.errorMessageKey = '';

    if (trainNumber.length > 0) {
      this.isLoading = true;

      this.trainService.searchTrains(trainNumber).subscribe({
        next: (response) => {
          this.filteredTrains = response.data.items;

          this.isLoading = false;

          this.changeDetector.markForCheck();
        },

        error: () => {
          this.errorMessageKey = 'TRAINS.ERRORS.SEARCH_FAILED';

          this.isLoading = false;

          this.changeDetector.markForCheck();
        },
      });

      return;
    }

    if (origin.length > 0 || destination.length > 0) {
      this.isLoading = true;

      this.trainService.filterTrains(origin, destination).subscribe({
        next: (response) => {
          this.filteredTrains = response.data.items;

          this.isLoading = false;

          this.changeDetector.markForCheck();
        },

        error: () => {
          this.errorMessageKey = 'TRAINS.ERRORS.FILTER_FAILED';

          this.isLoading = false;

          this.changeDetector.markForCheck();
        },
      });

      return;
    }

    this.filteredTrains = this.allTrains;
    this.isLoading = false;
  }

  openTrain(trainId: number): void {
    void this.router.navigate(['/trains', trainId]);
  }
}
