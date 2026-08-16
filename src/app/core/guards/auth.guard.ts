import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userId = localStorage.getItem('userId');

  if (userId) {
    return true;
  }

  // Redirect to login if not authorized
  router.navigate(['/login']);
  return false;
};
