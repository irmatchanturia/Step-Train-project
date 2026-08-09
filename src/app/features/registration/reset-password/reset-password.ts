import { ChangeDetectorRef, Component, inject } from '@angular/core';

import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import { ActivatedRoute, RouterLink } from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';

import { AuthService } from '../service/auth';

const uppercaseValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) {
    return null;
  }

  return /[A-Z]/.test(control.value) ? null : { uppercase: true };
};

const specialCharacterValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  if (!control.value) {
    return null;
  }

  return /[^A-Za-z0-9]/.test(control.value) ? null : { specialCharacter: true };
};

const passwordsMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password')?.value;

  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordsMismatch: true };
};

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {
  private readonly formBuilder = inject(FormBuilder);

  private readonly authService = inject(AuthService);

  private readonly activatedRoute = inject(ActivatedRoute);

  private readonly cdr = inject(ChangeDetectorRef);

  readonly resetPasswordForm = this.formBuilder.nonNullable.group(
    {
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          uppercaseValidator,
          specialCharacterValidator,
        ],
      ],

      confirmPassword: ['', Validators.required],
    },
    {
      validators: passwordsMatchValidator,
    },
  );

  readonly token = this.activatedRoute.snapshot.queryParamMap.get('token');

  isLoading = false;
  isSuccess = false;

  errorMessageKey = '';

  get hasValidToken(): boolean {
    return Boolean(this.token);
  }

  onSubmit(): void {
    this.errorMessageKey = '';

    if (!this.token) {
      this.errorMessageKey = 'RESET_PASSWORD.MESSAGES.INVALID_LINK';

      return;
    }

    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();

      return;
    }

    const password = this.resetPasswordForm.controls.password.value;

    this.isLoading = true;

    this.authService
      .resetPassword(this.token, password)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.isSuccess = true;

          this.resetPasswordForm.reset();

          this.cdr.detectChanges();
        },

        error: (error) => {
          console.error('Reset password failed:', error);

          this.errorMessageKey = 'RESET_PASSWORD.MESSAGES.ERROR';

          this.cdr.detectChanges();
        },
      });
  }
}
