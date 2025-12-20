import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { UserService } from '../services/user.service';

export const adminGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  return userService.fetchProfile().pipe(
    map((profile) => {
      if (!profile) {
        return router.createUrlTree(['/iniciar-sesion']);
      }
      if (profile.role !== 'admin') {
        return router.createUrlTree(['/mi-cuenta']);
      }
      return true;
    }),
    catchError(() => of(router.createUrlTree(['/iniciar-sesion'])))
  );
};
