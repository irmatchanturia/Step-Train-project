import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Aside } from '../aside/aside';
import { ProfileService } from '../../profile/service/profile-service';

@Component({
  selector: 'app-profile-layout',
  imports: [Aside, RouterOutlet],
  templateUrl: './profile-layout.html',
  styleUrl: './profile-layout.css',
})
export class ProfileLayout implements OnInit {
  readonly profileService = inject(ProfileService);

  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    this.profileService.getCurrentUser().subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load profile:', error);

        this.errorMessage = 'User information could not be loaded.';
        this.isLoading = false;
      },
    });
  }
}
