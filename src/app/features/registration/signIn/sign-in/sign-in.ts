import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../service/auth';

@Component({
  selector: 'app-sign-in',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css',
})
export class SignIn {
  email = '';
  password = '';

  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  signIn(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'გთხოვთ, შეავსოთ ყველა ველი.';
      return;
    }

    const userData = {
      email: this.email.trim(),
      password: this.password,
    };

    this.isLoading = true;

    this.authService
      .signIn(userData)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          console.log('Login response:', response);

          this.successMessage = 'ავტორიზაცია წარმატებით დასრულდა!';
          this.router.navigate(['/home']);
        },

        error: (error: HttpErrorResponse) => {
          console.error('Login error:', error);
          console.error('Backend response:', error.error);

          this.errorMessage =
            error.error?.message ??
            'ელფოსტა ან პაროლი არასწორია.';
        },
      });
  }
}