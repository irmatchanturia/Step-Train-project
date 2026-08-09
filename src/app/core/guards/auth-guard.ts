import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../../features/registration/service/auth';

export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const hasToken = Boolean(authService.getAccessToken());

  if (hasToken) {
    return true;
  }

  return router.createUrlTree(['/sign-in'], {
    queryParams: {
      returnUrl: state.url,
    },
  });
};
