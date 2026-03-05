import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class LoginModalService {
  private readonly openSubject = new BehaviorSubject<boolean>(false);
  private pendingResolvers: Array<(value: boolean) => void> = [];

  readonly isOpen$ = this.openSubject.asObservable();

  constructor(private userService: UserService) {}

  async open(): Promise<boolean> {
    if (this.userService.isAuthenticatedSync()) {
      return true;
    }

    this.openSubject.next(true);
    return new Promise<boolean>((resolve) => {
      this.pendingResolvers.push(resolve);
    });
  }

  complete(success: boolean): void {
    this.openSubject.next(false);
    const resolvers = this.pendingResolvers.splice(0);
    for (const resolver of resolvers) {
      resolver(success);
    }
  }

  cancel(): void {
    this.complete(false);
  }
}
