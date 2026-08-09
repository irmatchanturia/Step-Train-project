import { inject } from '@angular/core';

import { CanActivateFn, Router } from '@angular/router';

export const resetTokenGuard: CanActivateFn = (route) => {
  const token = route.queryParamMap.get('token');

  if (!token) {
    return true;
  }

  const router = inject(Router);

  return router.createUrlTree(['/reset-password'], {
    queryParams: {
      token,
    },
  });
};
