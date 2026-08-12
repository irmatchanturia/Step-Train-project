import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';

import { TrainService } from '../../registration/service/trains-service';
import { Train } from '../../registration/models/trains.models';
import { Station } from '../../registration/models/stations.model';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ReactiveFormsModule, TranslatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly trainService = inject(TrainService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  errorMessageKey = '';

  filteredTrains: Train[] = [];
  stations: Station[] = [];

  isSearching = false;

  trainSearchForm = new FormGroup({
    departure: new FormControl('', {
      nonNullable: true,
    }),

    destination: new FormControl('', {
      nonNullable: true,
    }),
  });

  ngOnInit(): void {
    this.loadStations();
  }

  searchTrains(): void {
    const { departure, destination } = this.trainSearchForm.getRawValue();

    const origin = departure.trim();
    const destinationValue = destination.trim();

    this.errorMessageKey = '';
    this.filteredTrains = [];

    if (!origin || !destinationValue) {
      this.errorMessageKey = 'HOME.ERRORS.BOTH_REQUIRED';
      return;
    }

    if (origin.toLowerCase() === destinationValue.toLowerCase()) {
      this.errorMessageKey = 'HOME.ERRORS.SAME_STATION';
      return;
    }

    this.isSearching = true;

    this.trainService
      .filterTrains(origin, destinationValue)
      .pipe(
        finalize(() => {
          this.isSearching = false;
          this.changeDetectorRef.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.filteredTrains = response.data.items;

          if (this.filteredTrains.length === 0) {
            this.errorMessageKey = 'HOME.ERRORS.NO_TRAINS';
          }
        },

        error: (error) => {
          console.error('Train search failed:', error);

          this.errorMessageKey = 'HOME.ERRORS.SEARCH_FAILED';
        },
      });
  }

  loadStations(): void {
    this.trainService.getStations().subscribe({
      next: (response) => {
        this.stations = response.data;

        this.changeDetectorRef.detectChanges();
      },

      error: (error) => {
        console.error('Failed to load stations:', error);

        this.errorMessageKey = 'HOME.ERRORS.STATIONS_FAILED';

        this.changeDetectorRef.detectChanges();
      },
    });
  }
  openTrain(trainId: number): void {
    void this.router.navigate(['/trains', trainId]);
  }
}
