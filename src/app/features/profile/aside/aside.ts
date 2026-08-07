import { Component, inject, Input } from '@angular/core';

import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';

import { ProfileUser } from '../../profile/models/user-models';
import { AuthService } from '../../registration/service/auth';

@Component({
  selector: 'app-aside',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './aside.html',
  styleUrl: './aside.css',
})
export class Aside {
  @Input() user: ProfileUser | null = null;
  @Input() isLoading = false;

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  get fullName(): string {
    return [this.user?.firstName, this.user?.lastName].filter(Boolean).join(' ');
  }

  get initials(): string {
    const firstInitial = this.user?.firstName?.trim().charAt(0) ?? '';

    const lastInitial = this.user?.lastName?.trim().charAt(0) ?? '';

    return `${firstInitial}${lastInitial}`.toUpperCase();
  }

  signOut(): void {
    this.authService.logout();

    void this.router.navigate(['/sign-in'], {
      replaceUrl: true,
    });
  }
}
