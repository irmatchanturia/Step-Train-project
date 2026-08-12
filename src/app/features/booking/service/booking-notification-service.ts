import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface BookingConfirmationPayload {
  email: string;
  bookingId: number;
  from: string;
  to: string;
  date: string;
  seat: string;
}

@Injectable({
  providedIn: 'root',
})
export class BookingNotificationService {
  private readonly http = inject(HttpClient);

  private readonly webhookUrl = 'http://localhost:5678/webhook/booking-confirmation';

  sendBookingConfirmation(payload: BookingConfirmationPayload): Observable<unknown> {
    return this.http.post(this.webhookUrl, payload);
  }
}
