import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '../service/profile-service';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  readonly formBuilder = inject(FormBuilder);
  readonly profileService = inject(ProfileService);
  readonly router = inject(Router);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  readonly passwordForm = this.formBuilder.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  showPasswordSuccessPopup = false;
  isUpdatingPassword = false;
  passwordErrorMessage = '';

  isDeletingAccount = false;
  deleteErrorMessage = '';
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
      this.passwordErrorMessage = 'New password must be different from your current password.';
      return;
    }

    this.isUpdatingPassword = true;
    this.passwordErrorMessage = '';
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

          this.passwordErrorMessage =
            error.error?.message ??
            'Password could not be updated. Please check your current password.';

          this.changeDetectorRef.markForCheck();
        },
      });
  }

  openDeleteConfirmation(): void {
    this.deleteErrorMessage = '';
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
    this.deleteErrorMessage = '';

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

          this.router.navigate(['/sign-in']);
        },
        error: (error) => {
          console.error('Failed to delete account:', error);

          this.showDeleteConfirmation = false;

          if (error.status === 0) {
            this.deleteErrorMessage =
              'The server took too long to respond. Please try again later.';
          } else {
            this.deleteErrorMessage = 'Your account could not be deleted. Please try again later.';
          }

          this.changeDetectorRef.markForCheck();
        },
      });
  }
}
