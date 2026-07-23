import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { signUpRequest } from '../models/signUp.models';
import { signInRequest } from '../models/signIn.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = 'https://trainsapi.stepacademy.ge/api/auth';

  signUp(userData: signUpRequest) {
    return this.http.post(`${this.baseUrl}/register`, userData);
  }

  signIn(userData: signInRequest) {
    return this.http.post(`${this.baseUrl}/login`, userData);
  }
}
