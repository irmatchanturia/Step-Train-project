import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';

import { signUpRequest } from '../models/signUp.models';
import { signInRequest, SignInResponse } from '../models/signIn.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = 'https://trainsapi.stepacademy.ge/api/auth';

  private readonly accessTokenKey = 'accessToken';
  private readonly refreshTokenKey = 'refreshToken';

  readonly isAuthenticated = signal<boolean>(this.hasAccessToken());

  signUp(userData: signUpRequest) {
    return this.http.post(`${this.baseUrl}/register`, userData);
  }

  signIn(userData: signInRequest): Observable<SignInResponse> {
    return this.http.post<SignInResponse>(`${this.baseUrl}/login`, userData);
  }

  saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.accessTokenKey, accessToken);

    localStorage.setItem(this.refreshTokenKey, refreshToken);

    this.isAuthenticated.set(true);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  logout(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);

    this.isAuthenticated.set(false);
  }

  private hasAccessToken(): boolean {
    return Boolean(localStorage.getItem(this.accessTokenKey));
  }
}
