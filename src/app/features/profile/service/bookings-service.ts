import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { BookingsResponse } from '../../profile/models/booking-models';
import { AuthService } from '../../registration/service/auth';

@Injectable({
  providedIn: 'root',
})
export class BookingsService {
  private readonly http = inject(HttpClient);

  private readonly bookingsUrl = 'https://trainsapi.stepacademy.ge/api/bookings';
  private readonly authService = inject(AuthService);

  getBookings(take: number = 10, page: number = 1): Observable<BookingsResponse> {
    const accessToken = this.authService.getAccessToken();
    if (!accessToken) {
      return throwError(() => new Error('Access token was not found'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });

    const params = new HttpParams().set('Take', take).set('Page', page);

    return this.http.get<BookingsResponse>(this.bookingsUrl, {
      headers,
      params,
    });
  }
  deleteBooking(bookingId: number): Observable<unknown> {
    const accessToken = this.authService.getAccessToken();
    if (!accessToken) {
      return throwError(() => new Error('Access token was not found'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });

    return this.http.delete<unknown>(`${this.bookingsUrl}/${bookingId}`, { headers });
  }

  filterBookings(
    from: string,
    to: string,
    take: number = 10,
    page: number = 1,
  ): Observable<BookingsResponse> {
    const accessToken = this.authService.getAccessToken();
    if (!accessToken) {
      return throwError(() => new Error('Access token was not found'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });

    let params = new HttpParams().set('Take', take).set('Page', page);

    if (from) {
      params = params.set('from', `${from}T00:00:00.000Z`);
    }

    if (to) {
      params = params.set('to', `${to}T23:59:59.999Z`);
    }

    return this.http.get<BookingsResponse>(`${this.bookingsUrl}/filter`, {
      headers,
      params,
    });
  }
}
