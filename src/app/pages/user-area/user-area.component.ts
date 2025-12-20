import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { combineLatest, forkJoin, map, take } from 'rxjs';
import {
  UserActivity,
  UserFriend,
  UserList,
  UserListItem,
  UserNotifications,
  UserPrivacy,
  UserProfile,
  UserRecommendation
} from '../../interfaces/user.interface';
import { MenuStateService } from '../../services/menu-state.service';
import { UserService } from '../../services/user.service';
import { UserListsComponent } from './components/user-lists/user-lists.component';
import { UserProfileHeaderComponent } from './components/user-profile-header/user-profile-header.component';
import { UserSettingsComponent } from './components/user-settings/user-settings.component';
import { UserSocialFeedComponent } from './components/user-social-feed/user-social-feed.component';
import { UserStatsComponent } from './components/user-stats/user-stats.component';
import { CreateListModalComponent } from './components/create-list-modal/create-list-modal.component';
import { ListDetailsComponent } from './components/list-details/list-details.component';
import { EditProfileModalComponent } from './components/edit-profile-modal/edit-profile-modal.component';
import { AddToListModalComponent } from './components/add-to-list-modal/add-to-list-modal.component';
import { UserChatComponent } from './components/user-chat/user-chat.component';
import { UserFavoritesComponent } from './components/user-favorites/user-favorites.component';

type TabType =
  | 'overview'
  | 'lists'
  | 'social'
  | 'favorites'
  | 'chat'
  | 'settings'
  | 'admin';

@Component({
  selector: 'app-user-area',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UserProfileHeaderComponent,
    UserListsComponent,
    UserSocialFeedComponent,
    UserSettingsComponent,
    UserStatsComponent,
    CreateListModalComponent,
    ListDetailsComponent,
    EditProfileModalComponent,
    AddToListModalComponent,
    UserChatComponent,
    UserFavoritesComponent
  ],
  templateUrl: './user-area.component.html',
  styleUrls: ['./user-area.component.scss'],
})
export class UserAreaComponent implements OnInit {
  public profile$ = this.userService.getProfile();
  public recommendations$ = this.userService.getRecommendations();
  public activities$ = this.userService.getActivities();
  public friends$ = this.userService.getFriends();
  public lists$ = this.userService.getLists();
  public favorites$ = this.userService.getFavorites();
  public isAuthenticated$ = this.userService.isAuthenticated$;
  public loading$ = this.userService.loading$;
  public error$ = this.userService.error$;
  
  // Filtered data for RESUMEN (Personal)
  public myActivities$ = combineLatest([this.activities$, this.profile$]).pipe(
    map(([activities, profile]) => activities.filter((activity) => !activity.user || activity.user.id === profile.id))
  );
  
  // Filtered data for SOCIAL (Community)
  public friendsActivities$ = combineLatest([this.activities$, this.profile$]).pipe(
    map(([activities, profile]) => activities.filter((activity) => activity.user && activity.user.id !== profile.id))
  );
  
  // Personal reminders (mock based on pending watchlist items)
  public myReminders$ = this.userService.getWatchlist().pipe(
    map(items => items.filter(item => item.state === 'pending').slice(0, 3))
  );

  public activeTab: TabType = 'overview';
  public isCreateListModalOpen = false;
  public isEditProfileModalOpen = false;
  public isAddToListModalOpen = false;
  
  public selectedList: UserList | null = null;
  public selectedListItems: UserListItem[] = [];

  constructor(
    private userService: UserService,
    private menuState: MenuStateService
  ) {}

  ngOnInit(): void {
    this.menuState.setActive('mi-cuenta');
  }

  setActiveTab(tab: TabType): void {
    this.activeTab = tab;
  }

  onUpdateStatus(event: { title: string; mood: string; visibility: 'public' | 'friends' | 'private' }): void {
    this.userService.updateWatchingNow({
      title: event.title,
      mood: event.mood,
      visibility: event.visibility || 'friends',
    }).subscribe();
  }

  onToggleFollow(friendId: string): void {
    this.userService.toggleFollow(friendId).subscribe();
  }

  onSaveSettings(event: { privacy: UserPrivacy; notifications: UserNotifications }): void {
    forkJoin([
      this.userService.updatePrivacy(event.privacy),
      this.userService.updateNotifications(event.notifications),
    ]).subscribe();
  }

  openCreateListModal(): void {
    this.isCreateListModalOpen = true;
  }

  closeCreateListModal(): void {
    this.isCreateListModalOpen = false;
  }

  onCreateList(event: { title: string; description: string; visibility: 'public' | 'friends' | 'private' }): void {
    this.userService.createList(event).subscribe();
  }

  onSelectList(list: UserList): void {
    this.selectedList = list;
    this.refreshSelectedListItems();
  }

  onCloseListDetails(): void {
    this.selectedList = null;
    this.selectedListItems = [];
  }

  openEditProfileModal(): void {
    this.isEditProfileModalOpen = true;
  }

  closeEditProfileModal(): void {
    this.isEditProfileModalOpen = false;
  }

  onSaveProfile(profileData: Partial<UserProfile>): void {
    this.userService.updateProfile(profileData).subscribe(() => {
      this.closeEditProfileModal();
    });
  }

  onRemoveListItem(itemId: string): void {
    if (this.selectedList) {
      this.userService.removeListItem(this.selectedList.id, itemId).subscribe(() => {
        this.refreshSelectedListItems();
      });
    }
  }

  openAddToListModal(): void {
    this.isAddToListModalOpen = true;
  }

  closeAddToListModal(): void {
    this.isAddToListModalOpen = false;
  }

  onAddListItem(item: { title: string; type: 'movie' | 'series'; state: 'pending' | 'watching' | 'finished' }): void {
    if (this.selectedList) {
      this.userService.addListItem(this.selectedList.id, item).subscribe(() => {
        this.refreshSelectedListItems();
      });
    }
  }

  onRemoveFavorite(id: string): void {
    this.userService.removeFavorite(id).subscribe();
  }

  onLogout(): void {
    this.userService.logout();
  }

  private refreshSelectedListItems(): void {
    if (!this.selectedList) return;
    this.userService.fetchListItems(this.selectedList.id).pipe(take(1)).subscribe((items) => {
      this.selectedListItems = items;
    });
  }
}
