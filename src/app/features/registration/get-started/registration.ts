import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../service/auth';
import { ToastService } from '../../../shared/service/toast-service';

@Component({
  selector: 'app-sign-up',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registration.html',
  styleUrl: './registration.css',
})
export class SignUp {
  errorMessage = '';
  successMessage = '';
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

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
  ) {}

  signUp(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      this.errorMessage = 'გთხოვთ, სწორად შეავსოთ ყველა ველი.';
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
      this.errorMessage = 'გთხოვთ, შეავსოთ ყველა ველი.';
      return;
    }

    this.isLoading = true;

    this.authService.signUp(userData).subscribe({
      next: () => {
        this.toastService.success('Registration completed successfully!');

        this.router.navigate(['/signIn']);
      },

      error: (error: HttpErrorResponse) => {
        this.isLoading = false;

        this.errorMessage = error.error?.message ?? 'რეგისტრაციისას დაფიქსირდა შეცდომა.';
      },
    });
  }
}
