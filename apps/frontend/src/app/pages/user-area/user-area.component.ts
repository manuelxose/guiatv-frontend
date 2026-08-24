import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, combineLatest, forkJoin, map, take, takeUntil } from 'rxjs';
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
import { UserSettingsComponent } from './components/user-settings/user-settings.component';
import { UserSocialFeedComponent } from './components/user-social-feed/user-social-feed.component';
import { UserSearchComponent } from './components/user-search/user-search.component';
import { CreateListModalComponent } from './components/create-list-modal/create-list-modal.component';
import { ListDetailsComponent } from './components/list-details/list-details.component';
import { EditProfileModalComponent } from './components/edit-profile-modal/edit-profile-modal.component';
import { AddToListModalComponent } from './components/add-to-list-modal/add-to-list-modal.component';
import { UserFavoritesComponent } from './components/user-favorites/user-favorites.component';
import { UserInteractionHistoryComponent } from './components/user-interaction-history/user-interaction-history.component';
import { AuthActionService } from '../../services/auth-action.service';
import { ChatService } from '../../services/chat.service';

type TabType =
  | 'feed'
  | 'friends'
  | 'lists'
  | 'favorites'
  | 'history'
  | 'settings'
  | 'admin';

@Component({
  selector: 'app-user-area',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UserListsComponent,
    UserSocialFeedComponent,
    UserSearchComponent,
    UserSettingsComponent,
    CreateListModalComponent,
    ListDetailsComponent,
    EditProfileModalComponent,
    AddToListModalComponent,
    UserFavoritesComponent,
    UserInteractionHistoryComponent,
  ],
  templateUrl: './user-area.component.html',
  styleUrls: ['./user-area.component.scss'],
})
export class UserAreaComponent implements OnInit, OnDestroy {
  public readonly sectionTabs: { key: TabType; label: string }[] = [
    { key: 'feed', label: 'Feed' },
    { key: 'friends', label: 'Amigos' },
    { key: 'lists', label: 'Listas' },
    { key: 'favorites', label: 'Favoritos' },
    { key: 'history', label: 'Historial' },
    { key: 'settings', label: 'Ajustes' },
  ];

  public profile$ = this.userService.getProfile();
  public recommendations$ = this.userService.getRecommendations();
  public activities$ = this.userService.getActivities();
  public friends$ = this.userService.getFriends();
  public lists$ = this.userService.getLists();
  public favorites$ = this.userService.getFavorites();
  public interactionHistory$ = this.userService.getInteractionHistory();
  public isAuthenticated$ = this.userService.isAuthenticated$;
  public loading$ = this.userService.loading$;
  public error$ = this.userService.error$;
  public isAdmin$ = this.profile$.pipe(map((profile) => profile?.role === 'admin'));

  public readonly unreadChatCount$ = this.chatService.getConversations().pipe(
    map((conversations) =>
      conversations.reduce((total, conversation) => total + Number(conversation.unreadCount || 0), 0)
    )
  );

  public activeTab: TabType = 'feed';
  public isMobileView = false;
  public isCreateListModalOpen = false;
  public isEditProfileModalOpen = false;
  public isAddToListModalOpen = false;
  private readonly destroy$ = new Subject<void>();

  public selectedList: UserList | null = null;
  public selectedListItems: UserListItem[] = [];
  @ViewChild(EditProfileModalComponent) editProfileModal?: EditProfileModalComponent;

  constructor(
    private userService: UserService,
    private menuState: MenuStateService,
    private authActionService: AuthActionService,
    private chatService: ChatService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  /** Re-fetch all user-area data after a failed load. */
  public retryLoad(): void {
    this.userService.loadUserAreaData().subscribe();
  }

  ngOnInit(): void {
    this.updateViewportState();
    this.menuState.setActive(this.router.url.startsWith('/comunidad') ? 'comunidad' : 'perfil');
    this.isAdmin$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isAdmin) => {
        if (!isAdmin && this.activeTab === 'admin') {
          this.activeTab = 'feed';
        }
      });

    combineLatest([this.route.data, this.route.queryParamMap])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([data, params]) => {
        const queryTab = String(params.get('tab') || '').trim().toLowerCase();
        // Support legacy tab query params
        const mapped = this.mapLegacyTab(queryTab);
        if (this.isTabType(mapped)) {
          this.activeTab = mapped;
          return;
        }

        const defaultTab = String(data?.['defaultTab'] || '').trim().toLowerCase();
        const mappedDefault = this.mapLegacyTab(defaultTab);
        if (this.isTabType(mappedDefault)) {
          this.activeTab = mappedDefault;
          return;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveTab(tab: TabType): void {
    this.activeTab = tab;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab === 'feed' ? null : tab },
      queryParamsHandling: 'merge',
    });
  }

  get visibleTabs(): { key: TabType; label: string }[] {
    return this.sectionTabs;
  }

  onUpdateStatus(event: { title: string; mood: string; visibility: 'public' | 'friends' | 'private' }): void {
    this.userService.updateWatchingNow({
      title: event.title,
      mood: event.mood,
      visibility: event.visibility || 'friends',
    }).subscribe();
  }

  onCreateCommunityList(event: {
    title: string;
    description: string;
    visibility: 'public' | 'friends' | 'private';
  }): void {
    this.userService.createList(event).subscribe();
  }

  onRecommendContent(event: {
    title: string;
    note: string;
    visibility: 'public' | 'friends' | 'private';
  }): void {
    this.userService
      .addRecommendation({
        title: event.title,
        note: event.note,
        visibility: event.visibility,
        type: 'program',
      })
      .subscribe();
  }

  onOpenFriendChat(friendId: string): void {
    this.chatService.createConversation(friendId).subscribe(() => {
      this.chatService.requestOpenChat(friendId);
    });
  }

  onUpdateHistory(item: {
    contentId: string;
    contentTitle: string;
    contentType: 'movie' | 'series' | 'program';
    rating?: number;
    status: 'seen' | 'watching' | 'pending' | 'dropped';
    platform?: string;
    genres?: string[];
    tmdbId?: number;
  }): void {
    this.userService.addContentInteraction(item).subscribe();
  }

  onToggleFollow(friendId: string): void {
    this.authActionService.toggleFollow(friendId).subscribe();
  }

  onLikeActivity(activityId: string): void {
    this.userService.toggleActivityLike(activityId).subscribe();
  }

  onCommentActivity(event: { activityId: string; text: string }): void {
    this.userService.addActivityComment(event.activityId, event.text).subscribe();
  }

  onSaveSettings(event: {
    privacy: UserPrivacy;
    notifications: UserNotifications;
    favoriteGenres: string[];
    preferredPlatforms: string[];
    discoveryDefaults: NonNullable<UserProfile['discoveryDefaults']>;
  }): void {
    forkJoin([
      this.userService.updatePrivacy(event.privacy),
      this.userService.updateNotifications(event.notifications),
      this.userService.saveGenrePreferences(event.favoriteGenres, event.preferredPlatforms),
      this.userService.saveDiscoveryDefaults(event.discoveryDefaults),
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

  onChangePassword(event: { currentPassword: string; newPassword: string }): void {
    this.userService.changePassword(event.currentPassword, event.newPassword).subscribe((success) => {
      this.editProfileModal?.onPasswordChangeResult(
        success,
        success ? 'Contraseña actualizada correctamente.' : 'No se pudo cambiar la contraseña. Verifica tu contraseña actual.'
      );
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

  getProfileInitials(name: string | null | undefined): string {
    const safeName = String(name || '').trim();
    if (!safeName) return 'GT';
    return safeName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  private refreshSelectedListItems(): void {
    if (!this.selectedList) return;
    this.userService.fetchListItems(this.selectedList.id).pipe(take(1)).subscribe((items) => {
      this.selectedListItems = items;
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateViewportState();
  }

  private updateViewportState(): void {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1280;
    this.isMobileView = width < 768;
  }

  private mapLegacyTab(value: string): string {
    if (value === 'social' || value === 'overview') return 'feed';
    if (value === 'chat' || value === 'recommendations') return 'feed';
    return value;
  }

  private isTabType(value: string): value is TabType {
    return (
      value === 'feed' ||
      value === 'friends' ||
      value === 'lists' ||
      value === 'favorites' ||
      value === 'history' ||
      value === 'settings' ||
      value === 'admin'
    );
  }
}
