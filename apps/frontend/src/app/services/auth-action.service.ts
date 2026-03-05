import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { LoginModalService } from './login-modal.service';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class AuthActionService {
  constructor(
    private loginModalService: LoginModalService,
    private userService: UserService
  ) {}

  runWithAuth<T>(action: () => Observable<T>): Observable<T | null> {
    if (this.userService.isAuthenticatedSync()) {
      return action();
    }

    return from(this.loginModalService.open()).pipe(
      switchMap((authenticated) => {
        if (!authenticated) {
          return of(null);
        }
        return action();
      })
    );
  }

  toggleFollow(userId: string): Observable<boolean | null> {
    return this.runWithAuth(() => this.userService.toggleFollow(userId));
  }
}
