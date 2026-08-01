import { Component, effect, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '../service/profile-service';
import { UpdateProfileRequest } from '../models/user-models';

@Component({
  selector: 'app-my-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './my-profile.html',
  styleUrl: './my-profile.css',
})
export class MyProfile {
  readonly formBuilder = inject(FormBuilder);
  readonly profileForm = this.formBuilder.nonNullable.group({
    pictureUrl: [''],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    address: [''],
    dob: [''],
  });
  isSaving = false;
  successMessage = '';
  errorMessage = '';
  readonly profileService = inject(ProfileService);
  constructor() {
    effect(() => {
      const user = this.profileService.currentUser();
      if (!user) {
        return;
      }
      this.profileForm.patchValue({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email ?? '',
        pictureUrl: user.details?.pictureUrl ?? '',
        phoneNumber: user.details?.phoneNumber ?? '',
        address: user.details?.address ?? '',
        dob: this.formatDateForInput(user.details?.dob),
      });
    });
  }

  //თარიღის გადაქცევა ინპუტის შესაბამის ფორმაში
  private formatDateForInput(date: string | null | undefined): string {
    if (!date) {
      return '';
    }

    return date.slice(0, 10);
  }

  private formatDateForBackend(date: string): string | null {
    if (!date) {
      return null;
    }

    return `${date}T00:00:00.000Z`;
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const profileData = this.profileForm.getRawValue();

    const updateProfileRequest: UpdateProfileRequest = {
      firstName: profileData.firstName.trim(),
      lastName: profileData.lastName.trim(),
      email: profileData.email.trim(),
      phoneNumber: profileData.phoneNumber.trim() || null,
      address: profileData.address.trim() || null,
      pictureUrl: profileData.pictureUrl.trim() || null,
      dateOfBirth: this.formatDateForBackend(profileData.dob),
    };

    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.profileService.updateCurrentUser(updateProfileRequest).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Profile updated successfully.';
        this.profileForm.markAsPristine();
      },
      error: (error) => {
        console.error('Failed to update profile:', error);

        this.isSaving = false;
        this.errorMessage = 'Profile could not be updated. Please try again.';
      },
    });
  }
}
