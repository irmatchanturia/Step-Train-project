import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { map, Observable, tap, throwError } from 'rxjs';
import {
  ProfileResponse,
  ProfileUser,
  UpdateProfileRequest,
} from '../../profile/models/user-models';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly profileUrl = 'https://trainsapi.stepacademy.ge/api/users/me';
  private readonly updateProfileUrl = 'https://trainsapi.stepacademy.ge/api/users';
  private readonly currentUserSignal = signal<ProfileUser | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();

  constructor(private http: HttpClient) {}

  getCurrentUser(): Observable<ProfileUser> {
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      return throwError(() => new Error('Access token was not found'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });

    return this.http.get<ProfileResponse>(this.profileUrl, { headers }).pipe(
      map((response) => response.data),

      tap((user) => {
        this.currentUserSignal.set(user);
      }),
    );
  }

  updateCurrentUser(request: UpdateProfileRequest): Observable<ProfileUser> {
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      return throwError(() => new Error('Access token was not found'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });

    return this.http.put<ProfileResponse>(this.updateProfileUrl, request, { headers }).pipe(
      map((response) => response.data),
      tap((user) => {
        this.currentUserSignal.set(user);
      }),
    );
  }
}
