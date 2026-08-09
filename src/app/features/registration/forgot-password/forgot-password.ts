import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../service/auth';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly forgotPasswordForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  isLoading = false;
  isSuccess = false;

  errorMessageKey = '';

  onSubmit(): void {
    this.errorMessageKey = '';

    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();

      return;
    }

    const email = this.forgotPasswordForm.controls.email.value.trim();

    this.isLoading = true;
    this.isSuccess = false;

    this.authService.forgetPassword(email).subscribe({
      next: () => {
        this.isLoading = false;
        this.isSuccess = true;

        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Forgot password request failed:', error);

        this.isLoading = false;

        this.errorMessageKey = 'FORGOT_PASSWORD.MESSAGES.ERROR';

        this.cdr.detectChanges();
      },
    });
  }
}
