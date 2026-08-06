import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../../app/features/registration/service/auth'

export const apiKeyInterceptorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const accessToken = authService.getAccessToken();

  const headers: Record<string, string> = {
    'x-api-key': environment.apiKey,
  };

  if (accessToken) {
    headers['Authorization'] = accessToken.startsWith('Bearer ')
      ? accessToken
      : `Bearer ${accessToken}`;
  }

  const authorizedRequest = req.clone({
    setHeaders: headers,
  });

  return next(authorizedRequest);
};
