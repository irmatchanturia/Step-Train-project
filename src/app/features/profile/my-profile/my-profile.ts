import { Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { TranslatePipe } from '@ngx-translate/core';

import { ProfileService } from '../service/profile-service';
import { UpdateProfileRequest } from '../models/user-models';

@Component({
  selector: 'app-my-profile',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './my-profile.html',
  styleUrl: './my-profile.css',
})
export class MyProfile {
  private readonly formBuilder = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);

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

  successMessageKey = '';
  errorMessageKey = '';

  constructor() {
    effect(() => {
      const user = this.profileService.currentUser();

      if (!user) {
        return;
      }

      /*
       * reset() განზრახ გამოიყენება patchValue()-ის ნაცვლად.
       *
       * ახალი user-ის ჩატვირთვის შემდეგ:
       * - form pristine ხდება
       * - touched state იწმინდება
       * - ძველი validation state აღარ რჩება
       */
      this.profileForm.reset(
        {
          firstName: user.firstName ?? '',

          lastName: user.lastName ?? '',

          email: user.email ?? '',

          pictureUrl: user.details?.pictureUrl ?? '',

          phoneNumber: user.details?.phoneNumber ?? '',

          address: user.details?.address ?? '',

          dob: this.formatDateForInput(user.details?.dob),
        },
        {
          emitEvent: false,
        },
      );
    });
  }

  onSubmit(): void {
    this.successMessageKey = '';
    this.errorMessageKey = '';

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

    this.profileService
      .updateCurrentUser(updateProfileRequest)
      .pipe(
        finalize(() => {
          this.isSaving = false;
        }),
      )
      .subscribe({
        next: () => {
          this.successMessageKey = 'MY_PROFILE.MESSAGES.UPDATE_SUCCESS';

          /*
           * currentUser signal უკვე განახლებულია
           * ProfileService-დან.
           *
           * effect() ავტომატურად გაუშვებს reset()-ს,
           * ამიტომ აქ ხელით patchValue აღარ გვჭირდება.
           */
        },

        error: (error) => {
          console.error('Failed to update profile:', error);

          this.errorMessageKey = 'MY_PROFILE.MESSAGES.UPDATE_FAILED';
        },
      });
  }

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
}
