import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, switchMap, tap, throwError } from 'rxjs';

import {
  ProfileResponse,
  ProfileUser,
  UpdateProfileRequest,
} from '../../profile/models/user-models';
import { ChangePasswordRequest } from '../models/setting-models';
import { AuthService } from '../../registration/service/auth';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly profileUrl = 'https://trainsapi.stepacademy.ge/api/users/me';

  private readonly updateProfileUrl = 'https://trainsapi.stepacademy.ge/api/users';

  private readonly currentUserSignal = signal<ProfileUser | null>(null);

  private readonly authService = inject(AuthService);

  private readonly http = inject(HttpClient);

  readonly currentUser = this.currentUserSignal.asReadonly();

  getCurrentUser(): Observable<ProfileUser> {
    const accessToken = this.authService.getAccessToken();

    if (!accessToken) {
      return throwError(() => new Error('Access token was not found'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });

    return this.http
      .get<ProfileResponse>(this.profileUrl, {
        headers,
      })
      .pipe(
        map((response) => response.data),

        tap((user) => {
          this.currentUserSignal.set(user);
        }),
      );
  }

  updateCurrentUser(request: UpdateProfileRequest): Observable<ProfileUser> {
    const accessToken = this.authService.getAccessToken();

    if (!accessToken) {
      return throwError(() => new Error('Access token was not found'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });

    /*
     * PUT response-ს აღარ ვენდობით როგორც
     * საბოლოო ProfileUser-ს.
     *
     * Update-ის წარმატების შემდეგ მაშინვე
     * ვაკეთებთ GET /users/me-ს.
     *
     * ამიტომ UI refresh-ის გარეშეც
     * ზუსტად backend-ში შენახულ მონაცემს მიიღებს.
     */
    return this.http
      .put<unknown>(this.updateProfileUrl, request, {
        headers,
      })
      .pipe(switchMap(() => this.getCurrentUser()));
  }

  changePassword(request: ChangePasswordRequest): Observable<unknown> {
    const accessToken = this.authService.getAccessToken();

    if (!accessToken) {
      return throwError(() => new Error('Access token was not found'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });

    return this.http.put<unknown>(
      'https://trainsapi.stepacademy.ge/api/users/change-password',
      request,
      {
        headers,
      },
    );
  }

  deleteProfile(): Observable<unknown> {
    const accessToken = this.authService.getAccessToken();

    if (!accessToken) {
      return throwError(() => new Error('Access token was not found'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });

    return this.http.delete<unknown>('https://trainsapi.stepacademy.ge/api/users/delete-profile', {
      headers,
      timeout: 20000,
    });
  }
}
