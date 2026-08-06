import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface BookingStep {
  number: number;
  label: string;
}

@Component({
  selector: 'app-booking-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './booking-layout.html',
  styleUrl: './booking-layout.css',
})
export class BookingLayout implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly steps: BookingStep[] = [
    {
      number: 1,
      label: 'Coach',
    },
    {
      number: 2,
      label: 'Date',
    },
    {
      number: 3,
      label: 'Seats',
    },
    {
      number: 4,
      label: 'Confirmation',
    },
  ];

  activeStep = 1;

  ngOnInit(): void {
    this.updateActiveStep(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.updateActiveStep(event.urlAfterRedirects);
      });
  }

  isStepActive(stepNumber: number): boolean {
    return this.activeStep === stepNumber;
  }

  isStepCompleted(stepNumber: number): boolean {
    return this.activeStep > stepNumber;
  }

  isConnectorCompleted(stepNumber: number): boolean {
    return this.activeStep > stepNumber;
  }

  private updateActiveStep(url: string): void {
    if (url.includes('/confirmation')) {
      this.activeStep = 4;
      return;
    }

    if (url.includes('/seats')) {
      this.activeStep = 3;
      return;
    }

    if (url.includes('/date')) {
      this.activeStep = 2;
      return;
    }

    this.activeStep = 1;
  }
}
