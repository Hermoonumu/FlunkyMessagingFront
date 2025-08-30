import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth-service';
import { inject } from '@angular/core';
import { map } from 'rxjs';

export const loginGuard: CanActivateFn = (route, state) => {
  const authSvc = inject(AuthService);
  const router = inject(Router);
  return authSvc.verifyTokens().pipe(
    map(isValid => {
      authSvc.isAuthenticated = isValid;
      return isValid ? true : router.createUrlTree(['/login']);
    })
  );
};
