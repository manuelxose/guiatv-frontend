import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { take } from 'rxjs';
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component';
import { UserListItem } from '../../interfaces/user.interface';
import { MenuStateService } from '../../services/menu-state.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-area',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NavBarComponent],
  templateUrl: './user-area.component.html',
  styleUrls: ['./user-area.component.scss'],
})
export class UserAreaComponent implements OnInit {
  public profile$ = this.userService.getProfile();
  public recommendations$ = this.userService.getRecommendations();
  public activities$ = this.userService.getActivities();
  public friends$ = this.userService.getFriends();
  public watchlist$ = this.userService.getWatchlist();

  //mockeamos a true de momento
  public isAuthenticated$ = this.userService.isAuthenticated$;

  public statusForm = this.fb.group({
    title: ['', [Validators.required]],
    mood: [''],
    visibility: ['friends'],
  });

  public recommendationForm = this.fb.group({
    title: ['', [Validators.required]],
    type: ['movie'],
    note: [''],
    rating: [8],
    visibility: ['friends'],
  });

  public settingsForm = this.fb.group({
    profilePublic: [true],
    shareActivity: [true],
    shareWatchlist: [true],
    showOnline: [true],
    recommendations: [true],
    followers: [true],
    weeklySummary: [false],
  });

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private menuState: MenuStateService
  ) {}

  ngOnInit(): void {
    this.menuState.setActive('mi-cuenta');

    this.userService
      .getProfile()
      .pipe(take(1))
      .subscribe((profile) => {
        this.statusForm.patchValue({
          title: profile.watchingNow.title,
          mood: profile.watchingNow.mood,
          visibility: profile.watchingNow.visibility,
        });

        this.settingsForm.patchValue({
          profilePublic: profile.privacy.profilePublic,
          shareActivity: profile.privacy.shareActivity,
          shareWatchlist: profile.privacy.shareWatchlist,
          showOnline: profile.privacy.showOnline,
          recommendations: profile.notifications.recommendations,
          followers: profile.notifications.followers,
          weeklySummary: profile.notifications.weeklySummary,
        });
      });
  }

  updateStatus(): void {
    if (this.statusForm.invalid) {
      this.statusForm.markAllAsTouched();
      return;
    }

    this.userService.updateWatchingNow({
      title: this.statusForm.value.title || '',
      mood: this.statusForm.value.mood || '',
      visibility: (this.statusForm.value.visibility as any) || 'friends',
    });
  }

  publishRecommendation(): void {
    if (this.recommendationForm.invalid) {
      this.recommendationForm.markAllAsTouched();
      return;
    }

    this.userService.addRecommendation({
      title: this.recommendationForm.value.title || '',
      type: (this.recommendationForm.value.type as any) || 'movie',
      note: this.recommendationForm.value.note || '',
      rating: this.recommendationForm.value.rating || undefined,
      visibility:
        (this.recommendationForm.value.visibility as any) || 'friends',
    });

    this.recommendationForm.reset({
      title: '',
      type: 'movie',
      note: '',
      rating: 8,
      visibility: 'friends',
    });
  }

  saveSettings(): void {
    const value = this.settingsForm.value;

    this.userService.updatePrivacy({
      profilePublic: !!value.profilePublic,
      shareActivity: !!value.shareActivity,
      shareWatchlist: !!value.shareWatchlist,
      showOnline: !!value.showOnline,
    });

    this.userService.updateNotifications({
      recommendations: !!value.recommendations,
      followers: !!value.followers,
      weeklySummary: !!value.weeklySummary,
    });
  }

  toggleFollow(friendId: string): void {
    this.userService.toggleFollow(friendId);
  }

  updateListItem(id: string, state: UserListItem['state']): void {
    this.userService.updateListItemState(id, state);
  }
}
