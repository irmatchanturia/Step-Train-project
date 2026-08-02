import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ToastService } from '../../../../shared/service/toast-service';
import { AuthService } from '../../service/auth';

@Component({
  selector: 'app-sign-in',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css',
})
export class SignIn {
  email = '';
  password = '';
  rememberMe = false;

  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  signIn(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'გთხოვთ, შეავსოთ ყველა ველი.';
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

          this.toastService.success('Login successful!');

          void this.router.navigate(['/']);
        },

        error: (error: HttpErrorResponse) => {
          console.error('Login error:', error);
          console.error('Backend response:', error.error);

          if (error.status === 401) {
            this.errorMessage = 'ელფოსტა ან პაროლი არასწორია.';
          } else if (error.status === 0) {
            this.errorMessage = 'სერვერთან დაკავშირება ვერ მოხერხდა.';
          } else {
            this.errorMessage =
              this.extractBackendMessage(error) ?? 'ავტორიზაცია ვერ მოხერხდა. სცადეთ თავიდან.';
          }

          this.changeDetectorRef.markForCheck();
        },
      });
  }

  private extractBackendMessage(error: HttpErrorResponse): string | null {
    if (typeof error.error === 'string') {
      return error.error;
    }

    return error.error?.message ?? error.error?.title ?? error.error?.data?.message ?? null;
  }
}
