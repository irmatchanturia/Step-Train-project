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
  forgetPassword(email: string): Observable<ForgetPasswordResponse> {
    const encodedEmail = encodeURIComponent(email.trim());

    return this.http.post<ForgetPasswordResponse>(
      `${this.baseUrl}/forget-password/${encodedEmail}`,
      null,
    );
  }
  resetPassword(token: string, password: string): Observable<ResetPasswordResponse> {
    return this.http.put<ResetPasswordResponse>(`${this.baseUrl}/reset-password`, {
      token,
      password,
    });
  }
  resendEmailVerification(email: string): Observable<ResendEmailVerificationResponse> {
    const encodedEmail = encodeURIComponent(email.trim());

    return this.http.post<ResendEmailVerificationResponse>(
      `${this.baseUrl}/resend-email-verification/${encodedEmail}`,
      null,
    );
  }
  verifyEmail(request: VerifyEmailRequest): Observable<VerifyEmailResponse> {
    return this.http.put<VerifyEmailResponse>(`${this.baseUrl}/verify-email`, request);
  }
}
export interface ForgetPasswordResponse {
  data: string;
  meta?: Record<string, unknown>;
}

export interface ResetPasswordResponse {
  data: number;
  meta?: Record<string, unknown>;
}

export interface ResendEmailVerificationResponse {
  data: number;
  meta?: Record<string, unknown>;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface VerifyEmailResponse {
  data: {
    accessToken: string;
    refreshToken: string;
  };
  meta?: Record<string, unknown>;
}
