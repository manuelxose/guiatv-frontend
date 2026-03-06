import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subject, combineLatest, filter, forkJoin, map, of, take, takeUntil } from 'rxjs';
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
import { AuthActionService } from '../../services/auth-action.service';
import { ChatService } from '../../services/chat.service';

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
export class UserAreaComponent implements OnInit, OnDestroy {
  public readonly mobileSectionTabs: { key: TabType; label: string }[] = [
    { key: 'overview', label: 'Resumen' },
    { key: 'lists', label: 'Mis listas' },
    { key: 'favorites', label: 'Favoritos' },
    { key: 'social', label: 'Comunidad' },
    { key: 'chat', label: 'Chat' },
    { key: 'settings', label: 'Ajustes' },
  ];
  public profile$ = this.userService.getProfile();
  public recommendations$ = this.userService.getRecommendations();
  public activities$ = this.userService.getActivities();
  public friends$ = this.userService.getFriends();
  public lists$ = this.userService.getLists();
  public favorites$ = this.userService.getFavorites();
  public isAuthenticated$ = this.userService.isAuthenticated$;
  public loading$ = this.userService.loading$;
  public error$ = this.userService.error$;
  public isAdmin$ = this.profile$.pipe(map((profile) => profile?.role === 'admin'));
  public mobileSectionTabsWithAdmin$ = combineLatest([
    this.isAdmin$,
    of(this.mobileSectionTabs),
  ]).pipe(
    map(([isAdmin, tabs]) =>
      isAdmin ? [...tabs, { key: 'admin' as TabType, label: 'Admin' }] : tabs
    )
  );
  public readonly unreadChatCount$ = this.chatService.getConversations().pipe(
    map((conversations) =>
      conversations.reduce((total, conversation) => total + Number(conversation.unreadCount || 0), 0)
    )
  );
  
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
  public isMobileView = false;
  public isCommunityRoute = false;
  public isCreateListModalOpen = false;
  public isEditProfileModalOpen = false;
  public isAddToListModalOpen = false;
  private readonly destroy$ = new Subject<void>();
  
  public selectedList: UserList | null = null;
  public selectedListItems: UserListItem[] = [];

  constructor(
    private userService: UserService,
    private menuState: MenuStateService,
    private authActionService: AuthActionService,
    private chatService: ChatService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.updateViewportState();
    this.applyRouteContext(this.router.url);

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        const navEnd = event as NavigationEnd;
        this.applyRouteContext(navEnd.urlAfterRedirects || navEnd.url);
      });

    this.isAdmin$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isAdmin) => {
        if (!isAdmin && this.activeTab === 'admin') {
          this.activeTab = 'overview';
        }
      });

    combineLatest([this.route.data, this.route.queryParamMap])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([data, params]) => {
        const queryTab = String(params.get('tab') || '')
          .trim()
          .toLowerCase();
        if (this.isTabType(queryTab)) {
          this.activeTab = queryTab;
          return;
        }

        const defaultTab = String(data?.['defaultTab'] || '')
          .trim()
          .toLowerCase();
        if (this.isTabType(defaultTab)) {
          this.activeTab = defaultTab;
          return;
        }

        if (this.isCommunityRoute) {
          this.activeTab = 'chat';
          return;
        }

        if (this.activeTab === 'admin') {
          this.activeTab = 'overview';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveTab(tab: TabType): void {
    this.activeTab = tab;
  }

  openMoreTab(tab: 'lists' | 'admin'): void {
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
    this.authActionService.toggleFollow(friendId).subscribe();
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

  private applyRouteContext(url: string): void {
    this.isCommunityRoute = this.isCommunityUrl(url);
    this.menuState.setActive(this.isCommunityRoute ? 'comunidad' : 'mi-cuenta');

    if (this.isCommunityRoute && this.activeTab !== 'chat') {
      this.activeTab = 'chat';
    }
  }

  private isCommunityUrl(url: string): boolean {
    const path = String(url || '').split('?')[0].split('#')[0];
    return path === '/comunidad' || path.startsWith('/comunidad/');
  }

  private isTabType(value: string): value is TabType {
    return (
      value === 'overview' ||
      value === 'lists' ||
      value === 'social' ||
      value === 'favorites' ||
      value === 'chat' ||
      value === 'settings' ||
      value === 'admin'
    );
  }
}
