import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../app/features/registration/service/auth';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private readonly authService = inject(AuthService);
  private readonly translateService = inject(TranslateService);

  readonly isAuthenticated = this.authService.isAuthenticated;

  selectedLanguage: 'ka' | 'en';

  constructor() {
    this.translateService.setFallbackLang('ka');

    const savedLanguage = localStorage.getItem('language');

    if (savedLanguage === 'ka' || savedLanguage === 'en') {
      this.selectedLanguage = savedLanguage;
    } else {
      this.selectedLanguage = 'ka';
    }

    this.translateService.use(this.selectedLanguage);
  }

  switchLanguage(language: 'ka' | 'en'): void {
    if (this.selectedLanguage === language) {
      return;
    }

    this.selectedLanguage = language;

    localStorage.setItem('language', language);

    this.translateService.use(language);
  }
}
