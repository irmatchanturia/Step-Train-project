import { Injectable, signal } from '@angular/core';

import { BookingDraft } from '../models/booking-draft-model';

const EMPTY_BOOKING_DRAFT: BookingDraft = {
  trainId: null,
  scheduleId: null,
  coachId: null,
  travelDate: null,
  seatIds: [],
};

@Injectable({
  providedIn: 'root',
})
export class BookingStateService {
  private readonly storageKey = 'bookingDraft';

  private readonly bookingDraftSignal = signal<BookingDraft>(this.readStoredDraft());

  readonly bookingDraft = this.bookingDraftSignal.asReadonly();

  initializeJourney(trainId: number, scheduleId: number): void {
    const currentDraft = this.bookingDraftSignal();

    const isSameJourney =
      currentDraft.trainId === trainId && currentDraft.scheduleId === scheduleId;

    if (isSameJourney) {
      return;
    }

    this.updateDraft({
      ...EMPTY_BOOKING_DRAFT,
      trainId,
      scheduleId,
    });
  }

  selectCoach(coachId: number): void {
    this.updateDraft({
      ...this.bookingDraftSignal(),
      coachId,
      travelDate: null,
      seatIds: [],
    });
  }

  selectTravelDate(travelDate: string): void {
    this.updateDraft({
      ...this.bookingDraftSignal(),
      travelDate,
      seatIds: [],
    });
  }
  clearTravelDate(): void {
    this.updateDraft({
      ...this.bookingDraftSignal(),
      travelDate: null,
      seatIds: [],
    });
  }

  selectSeats(seatIds: number[]): void {
    this.updateDraft({
      ...this.bookingDraftSignal(),
      seatIds,
    });
  }

  clearDraft(): void {
    this.bookingDraftSignal.set({
      ...EMPTY_BOOKING_DRAFT,
    });

    sessionStorage.removeItem(this.storageKey);
  }

  private updateDraft(draft: BookingDraft): void {
    this.bookingDraftSignal.set(draft);

    sessionStorage.setItem(this.storageKey, JSON.stringify(draft));
  }

  private readStoredDraft(): BookingDraft {
    const storedDraft = sessionStorage.getItem(this.storageKey);

    if (!storedDraft) {
      return {
        ...EMPTY_BOOKING_DRAFT,
      };
    }

    try {
      return JSON.parse(storedDraft) as BookingDraft;
    } catch {
      sessionStorage.removeItem(this.storageKey);

      return {
        ...EMPTY_BOOKING_DRAFT,
      };
    }
  }
}
