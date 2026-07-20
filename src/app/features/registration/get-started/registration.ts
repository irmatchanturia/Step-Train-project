import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../service/auth';

@Component({
  selector: 'app-sign-up',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registration.html',
  styleUrl: './registration.css',
})
export class SignUp {
  firstName = '';
  lastName = '';
  email = '';
  password = '';

  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  signUp(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.firstName.trim() || !this.lastName.trim() || !this.email.trim() || !this.password) {
      this.errorMessage = 'გთხოვთ, შეავსოთ ყველა ველი.';
      return;
    }

    const passwordPattern = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

    if (!passwordPattern.test(this.password)) {
      this.errorMessage =
        'პაროლი უნდა შეიცავდეს მინიმუმ 8 სიმბოლოს, ერთ დიდ ასოს და ერთ სპეციალურ სიმბოლოს.';
      return;
    }

    const userData = {
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim(),
      password: this.password,
    };

    this.isLoading = true;

    this.authService.signUp(userData).subscribe({
      next: () => {
        this.isLoading = false;

        this.successMessage = 'რეგისტრაცია წარმატებით დასრულდა!';

        this.firstName = '';
        this.lastName = '';
        this.email = '';
        this.password = '';

        this.router.navigate(['/sign-in']);
      },

      error: (error: HttpErrorResponse) => {
        this.isLoading = false;

        this.errorMessage = error.error?.message ?? 'რეგისტრაციისას დაფიქსირდა შეცდომა.';
      },
    });
  }
}
