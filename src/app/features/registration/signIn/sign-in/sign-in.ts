import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';

import { ToastService } from '../../../../shared/service/toast-service';
import { AuthService } from '../../service/auth';

@Component({
  selector: 'app-sign-in',
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css',
})
export class SignIn {
  private readonly authService = inject(AuthService);

  private readonly router = inject(Router);

  private readonly route = inject(ActivatedRoute);

  private readonly toastService = inject(ToastService);

  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  private readonly translateService = inject(TranslateService);

  email = '';
  password = '';
  rememberMe = false;

  errorMessageKey = '';
  backendErrorMessage = '';

  isLoading = false;

  signIn(): void {
    this.errorMessageKey = '';
    this.backendErrorMessage = '';

    if (!this.email.trim() || !this.password) {
      this.errorMessageKey = 'SIGN_IN.MESSAGES.ALL_FIELDS_REQUIRED';

      return;
    }

    const userData = {
      email: this.email.trim(),
      password: this.password,
    };

    this.isLoading = true;

    this.authService
      .signIn(userData)
      .pipe(
        finalize(() => {
          this.isLoading = false;

          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          const { accessToken, refreshToken } = response.data;

          this.authService.saveTokens(accessToken, refreshToken, this.rememberMe);

          const successMessage = this.translateService.instant('SIGN_IN.MESSAGES.LOGIN_SUCCESS');

          this.toastService.success(successMessage);

          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

          if (returnUrl) {
            void this.router.navigateByUrl(returnUrl);
          } else {
            void this.router.navigate(['/']);
          }
        },

        error: (error: HttpErrorResponse) => {
          console.error('Login error:', error);

          console.error('Backend response:', error.error);

          if (error.status === 401) {
            this.errorMessageKey = 'SIGN_IN.MESSAGES.INVALID_CREDENTIALS';
          } else if (error.status === 0) {
            this.errorMessageKey = 'SIGN_IN.MESSAGES.SERVER_CONNECTION';
          } else {
            const backendMessage = this.extractBackendMessage(error);

            if (backendMessage) {
              this.backendErrorMessage = backendMessage;
            } else {
              this.errorMessageKey = 'SIGN_IN.MESSAGES.LOGIN_FAILED';
            }
          }

          this.changeDetectorRef.markForCheck();
        },
      });
  }

  onRememberMeChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;

    this.rememberMe = checkbox.checked;
  }

  private extractBackendMessage(error: HttpErrorResponse): string | null {
    if (typeof error.error === 'string') {
      return error.error;
    }

    return error.error?.message ?? error.error?.title ?? error.error?.data?.message ?? null;
  }
}
