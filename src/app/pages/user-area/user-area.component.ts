import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Observable, map, of, take } from 'rxjs';
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component';
import {
  UserActivity,
  UserFriend,
  UserList,
  UserListItem,
  UserNotifications,
  UserPrivacy,
  UserProfile,
  UserRecommendation,
  Top10Item,
  Top10Category,
  NewsItem
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
    NavBarComponent,
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
  
  // Filtered data for RESUMEN (Personal)
  public myActivities$ = this.activities$.pipe(
    map(activities => activities.filter(a => !a.user || a.user.id === 'user-01'))
  );
  
  // Filtered data for SOCIAL (Community)
  public friendsActivities$ = this.activities$.pipe(
    map(activities => activities.filter(a => a.user && a.user.id !== 'user-01'))
  );
  
  // Personal reminders (mock based on pending watchlist items)
  public myReminders$ = this.userService.getWatchlist().pipe(
    map(items => items.filter(item => item.state === 'pending').slice(0, 3))
  );

  // Mock authentication for now
  public isAuthenticated$ = of(true);

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

  onUpdateStatus(event: { title: string; mood: string }): void {
    this.userService.updateWatchingNow({
      title: event.title,
      mood: event.mood,
      visibility: 'friends', // Default visibility
    });
  }

  onToggleFollow(friendId: string): void {
    this.userService.toggleFollow(friendId);
  }

  onSaveSettings(event: { privacy: UserPrivacy; notifications: UserNotifications }): void {
    this.userService.updatePrivacy(event.privacy);
    this.userService.updateNotifications(event.notifications);
  }

  openCreateListModal(): void {
    this.isCreateListModalOpen = true;
  }

  closeCreateListModal(): void {
    this.isCreateListModalOpen = false;
  }

  onCreateList(event: { title: string; description: string; visibility: 'public' | 'friends' | 'private' }): void {
    this.userService.createList(event);
  }

  onSelectList(list: UserList): void {
    this.selectedList = list;
    // In a real app, we would fetch items for this specific list
    // For now, we'll just show the watchlist items as a mock
    this.userService.getWatchlist().pipe(take(1)).subscribe(items => {
      this.selectedListItems = items;
    });
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
    this.userService.updateProfile(profileData);
    this.closeEditProfileModal();
  }

  onRemoveListItem(itemId: string): void {
    if (this.selectedList) {
      this.userService.removeListItem(this.selectedList.id, itemId);
      // Refresh the list items
      this.userService.getWatchlist().pipe(take(1)).subscribe(items => {
        this.selectedListItems = items;
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
      this.userService.addListItem(this.selectedList.id, item);
      // Refresh the list items
      this.userService.getWatchlist().pipe(take(1)).subscribe(items => {
        this.selectedListItems = items;
      });
    }
  }
}
