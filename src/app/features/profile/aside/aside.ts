import { Component, inject, Input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ProfileUser } from '../../profile/models/user-models';

@Component({
  selector: 'app-aside',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './aside.html',
  styleUrl: './aside.css',
})
export class Aside {
  @Input() user: ProfileUser | null = null;
  @Input() isLoading = false;
  private readonly router = inject(Router);

  get fullName(): string {
    return [this.user?.firstName, this.user?.lastName].filter(Boolean).join(' ');
  }

  get initials(): string {
    const firstInitial = this.user?.firstName?.trim().charAt(0) ?? '';

    const lastInitial = this.user?.lastName?.trim().charAt(0) ?? '';

    return `${firstInitial}${lastInitial}`.toUpperCase();
  }

  signOut(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    void this.router.navigate(['/sign-in'], {
      replaceUrl: true,
    });
  }
}
