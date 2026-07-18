import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { SignUpRequest } from '../models/signUp';
import { signInRequest } from '../models/signIn';

@Service()
export class AuthService {
  public http = inject(HttpClient);
  public baseUrl = 'https://trainsapi.stepacademy.ge/api/auth';

  signUp(userData: SignUpRequest) {
    return this.http.post(`${this.baseUrl}/register`, userData);
  }

  signIn(userData: signInRequest) {
    return this.http.post(`${this.baseUrl}/login`, userData);
  }
}
