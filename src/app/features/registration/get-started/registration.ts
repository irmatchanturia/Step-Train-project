import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../service/auth';
import { ToastService } from '../../../shared/service/toast-service';

@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './registration.html',
  styleUrl: './registration.css',
})
export class SignUp {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly translateService = inject(TranslateService);

  errorMessageKey = '';
  backendErrorMessage = '';
  successMessageKey = '';

  isLoading = false;

  registrationForm = new FormGroup({
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),

    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/)],
    }),
  });

  signUp(): void {
    this.errorMessageKey = '';
    this.backendErrorMessage = '';
    this.successMessageKey = '';

    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();

      this.errorMessageKey = 'SIGN_UP.MESSAGES.FORM_INVALID';

      return;
    }

    const formValue = this.registrationForm.getRawValue();

    const userData = {
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      email: formValue.email.trim(),
      password: formValue.password,
    };

    if (!userData.firstName || !userData.lastName || !userData.email) {
      this.errorMessageKey = 'SIGN_UP.MESSAGES.ALL_FIELDS_REQUIRED';

      return;
    }

    this.isLoading = true;

    this.authService.signUp(userData).subscribe({
      next: async () => {
        this.isLoading = false;


        const navigationSucceeded = await this.router.navigate(['/verify-email'], {
          queryParams: {
            email: userData.email,
          },
        });


        if (!navigationSucceeded) {
          console.error('Navigation to verify-email was cancelled.');

          return;
        }

        const successMessage = this.translateService.instant(
          'SIGN_UP.MESSAGES.REGISTRATION_SUCCESS',
        );

        this.toastService.success(successMessage);
      },

      error: (error: HttpErrorResponse) => {
        this.isLoading = false;

        console.error('Registration failed:', error);

        if (error.error?.message) {
          this.backendErrorMessage = error.error.message;
        } else {
          this.errorMessageKey = 'SIGN_UP.MESSAGES.REGISTRATION_FAILED';
        }
      },
    });
  }
}
