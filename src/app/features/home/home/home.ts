import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TrainService } from '../../registration/service/trains-service';
import { Train } from '../../registration/models/trains.models';
import { finalize } from 'rxjs';
import { Station } from '../../registration/models/stations.model';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private trainService = inject(TrainService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  errorMessage = '';
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

  searchTrains(): void {
    const { departure, destination } = this.trainSearchForm.getRawValue();
    const origin = departure.trim();
    const destinationValue = destination.trim();

    this.errorMessage = '';
    this.filteredTrains = [];
    if (!origin || !destinationValue) {
      this.errorMessage = 'Please enter both origin and destination.';
      return;
    }
    if (origin.toLowerCase() === destinationValue.toLowerCase()) {
      this.errorMessage = 'Origin and destination must be different.';
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
            this.errorMessage = 'No trains found for this route.';
          }
        },
        error: (error) => {
          console.error('Train search failed:', error);

          this.errorMessage = 'Something went wrong while searching for trains.';
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

        this.errorMessage = 'Could not load stations.';
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  ngOnInit(): void {
    this.loadStations();
  }
}
