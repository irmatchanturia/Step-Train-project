import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../service/auth';

@Component({
  selector: 'app-verify-email',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css',
})
export class VerifyEmail {
  private readonly formBuilder = inject(FormBuilder);

  private readonly authService = inject(AuthService);

  private readonly activatedRoute = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly cdr = inject(ChangeDetectorRef);

  readonly verifyEmailForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],

    code: ['', Validators.required],
  });

  isVerifying = false;
  isResending = false;

  successMessageKey = '';
  errorMessageKey = '';
  resendSuccessMessageKey = '';

  constructor() {
    const email = this.activatedRoute.snapshot.queryParamMap.get('email');

    if (email) {
      this.verifyEmailForm.patchValue({
        email,
      });
    }
  }

  onSubmit(): void {
    this.successMessageKey = '';
    this.errorMessageKey = '';
    this.resendSuccessMessageKey = '';

    if (this.verifyEmailForm.invalid) {
      this.verifyEmailForm.markAllAsTouched();

      return;
    }

    const formValue = this.verifyEmailForm.getRawValue();

    this.isVerifying = true;

    this.authService
      .verifyEmail({
        email: formValue.email.trim(),
        code: formValue.code.trim(),
      })
      .pipe(
        finalize(() => {
          this.isVerifying = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.authService.saveTokens(response.data.accessToken, response.data.refreshToken, false);

          this.successMessageKey = 'VERIFY_EMAIL.MESSAGES.SUCCESS';

          this.cdr.detectChanges();

          setTimeout(() => {
            this.router.navigate(['/']);
          }, 1200);
        },

        error: (error) => {
          console.error('Verify email failed:', error);

          this.errorMessageKey = 'VERIFY_EMAIL.MESSAGES.ERROR';

          this.cdr.detectChanges();
        },
      });
  }

  resendCode(): void {
    this.successMessageKey = '';
    this.errorMessageKey = '';
    this.resendSuccessMessageKey = '';

    const emailControl = this.verifyEmailForm.controls.email;

    emailControl.markAsTouched();

    if (emailControl.invalid) {
      return;
    }

    const email = emailControl.value.trim();

    this.isResending = true;

    this.authService
      .resendEmailVerification(email)
      .pipe(
        finalize(() => {
          this.isResending = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.resendSuccessMessageKey = 'VERIFY_EMAIL.MESSAGES.RESEND_SUCCESS';

          this.cdr.detectChanges();
        },

        error: (error) => {
          console.error('Resend verification failed:', error);

          this.errorMessageKey = 'VERIFY_EMAIL.MESSAGES.RESEND_ERROR';

          this.cdr.detectChanges();
        },
      });
  }
}
