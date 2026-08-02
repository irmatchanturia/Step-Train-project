import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const accessToken = localStorage.getItem('accessToken');

  if (accessToken) {
    return true;
  }

  return router.createUrlTree(['/sign-in'], {
    queryParams: {
      returnUrl: state.url,
    },
  });
};
