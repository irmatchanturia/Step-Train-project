import { ChangeDetectorRef, Component, inject } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';

import { ProfileService } from '../service/profile-service';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  private readonly formBuilder = inject(FormBuilder);

  private readonly profileService = inject(ProfileService);

  private readonly router = inject(Router);

  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  readonly passwordForm = this.formBuilder.nonNullable.group({
    currentPassword: ['', Validators.required],

    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  showPasswordSuccessPopup = false;

  isUpdatingPassword = false;

  passwordErrorMessageKey = '';
  passwordBackendErrorMessage = '';

  isDeletingAccount = false;

  deleteErrorMessageKey = '';

  showDeleteConfirmation = false;

  closePasswordSuccessPopup(): void {
    this.showPasswordSuccessPopup = false;
  }

  updatePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();

      return;
    }

    const request = this.passwordForm.getRawValue();

    if (request.currentPassword === request.newPassword) {
      this.passwordErrorMessageKey = 'SETTINGS.ERRORS.SAME_PASSWORD';

      this.passwordBackendErrorMessage = '';

      return;
    }

    this.isUpdatingPassword = true;

    this.passwordErrorMessageKey = '';
    this.passwordBackendErrorMessage = '';

    this.showPasswordSuccessPopup = false;

    this.profileService
      .changePassword(request)
      .pipe(
        finalize(() => {
          this.isUpdatingPassword = false;

          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.passwordForm.reset({
            currentPassword: '',
            newPassword: '',
          });

          this.showPasswordSuccessPopup = true;

          this.changeDetectorRef.markForCheck();
        },

        error: (error) => {
          console.error('Failed to update password:', error);

          if (error.error?.message) {
            this.passwordBackendErrorMessage = error.error.message;
          } else {
            this.passwordErrorMessageKey = 'SETTINGS.ERRORS.PASSWORD_UPDATE_FAILED';
          }

          this.changeDetectorRef.markForCheck();
        },
      });
  }

  openDeleteConfirmation(): void {
    this.deleteErrorMessageKey = '';

    this.showDeleteConfirmation = true;
  }

  closeDeleteConfirmation(): void {
    if (this.isDeletingAccount) {
      return;
    }

    this.showDeleteConfirmation = false;
  }

  confirmDeleteAccount(): void {
    this.isDeletingAccount = true;

    this.deleteErrorMessageKey = '';

    this.profileService
      .deleteProfile()
      .pipe(
        finalize(() => {
          this.isDeletingAccount = false;

          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          localStorage.removeItem('accessToken');

          localStorage.removeItem('refreshToken');

          this.showDeleteConfirmation = false;

          void this.router.navigate(['/sign-in']);
        },

        error: (error) => {
          console.error('Failed to delete account:', error);

          this.showDeleteConfirmation = false;

          if (error.status === 0) {
            this.deleteErrorMessageKey = 'SETTINGS.ERRORS.SERVER_TIMEOUT';
          } else {
            this.deleteErrorMessageKey = 'SETTINGS.ERRORS.DELETE_ACCOUNT_FAILED';
          }

          this.changeDetectorRef.markForCheck();
        },
      });
  }
}
