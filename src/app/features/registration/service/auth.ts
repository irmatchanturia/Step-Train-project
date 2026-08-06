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

  saveTokens(accessToken: string, refreshToken: string, rememberMe: boolean): void {
    this.clearTokens();

    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem(this.accessTokenKey, accessToken);
    storage.setItem(this.refreshTokenKey, refreshToken);

    this.isAuthenticated.set(true);

    console.log('Saving tokens in:', rememberMe ? 'localStorage' : 'sessionStorage');

    console.log(
      'Token exists immediately after saving:',
      Boolean(storage.getItem(this.accessTokenKey)),
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey) ?? sessionStorage.getItem(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    return (
      localStorage.getItem(this.refreshTokenKey) ?? sessionStorage.getItem(this.refreshTokenKey)
    );
  }

  clearTokens(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);

    sessionStorage.removeItem(this.accessTokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);

    this.isAuthenticated.set(false);
  }

  logout(): void {
    this.clearTokens();
  }

  private hasAccessToken(): boolean {
    return Boolean(
      localStorage.getItem(this.accessTokenKey) ?? sessionStorage.getItem(this.accessTokenKey),
    );
  }
}
