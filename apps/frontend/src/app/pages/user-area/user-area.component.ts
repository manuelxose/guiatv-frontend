import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, combineLatest, forkJoin, map, take, takeUntil } from 'rxjs';
import {
  CommunityList,
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
import { PersonalizationPreferencesComponent } from './components/personalization-preferences/personalization-preferences.component';
import { AssistantPreferencesComponent } from './components/assistant-preferences/assistant-preferences.component';
import { CommunityListCardComponent } from './components/community-list-card/community-list-card.component';
import { CompletionMeterComponent } from '../../components/completion-meter/completion-meter.component';
import { CatalogRailComponent } from '../../components/catalog-rail/catalog-rail.component';
import { AuthActionService } from '../../services/auth-action.service';
import { ChatService } from '../../services/chat.service';
import { ChatbotService } from '../../services/chatbot.service';
import { CatalogItem, CatalogService } from '../../services/catalog.service';
import { computePersonalizationCompletion, PersonalizationCompletion } from '../../utils/personalization-completion';

type TabType =
  | 'overview' | 'tv' | 'streaming' | 'sports' | 'library' | 'community' | 'assistant' | 'notifications' | 'account'
  | 'feed' | 'friends' | 'lists' | 'favorites' | 'history' | 'settings'
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
    PersonalizationPreferencesComponent,
    AssistantPreferencesComponent,
    CompletionMeterComponent,
    CatalogRailComponent,
    CommunityListCardComponent,
  ],
  templateUrl: './user-area.component.html',
  styleUrls: ['./user-area.component.scss'],
})
export class UserAreaComponent implements OnInit, OnDestroy {
  /**
   * The one source of truth for both the mobile tab grid and the desktop
   * sidebar nav (see `visibleTabs` below) — previously the desktop sidebar
   * had its own hardcoded 4-shortcut list that covered only 4 of these 9
   * destinations. 'streaming' and 'notifications' used to be separate rows
   * here even though both rendered the exact same <app-user-settings> as
   * 'account' — collapsed into one 'account' entry; `mapLegacyTab` still
   * resolves old `?tab=streaming`/`?tab=notifications` links to it.
   */
  public readonly sectionTabs: { key: TabType; label: string }[] = [
    { key: 'overview', label: 'Resumen' },
    { key: 'tv', label: 'Mi TV' },
    { key: 'sports', label: 'Deportes' },
    { key: 'library', label: 'Biblioteca' },
    { key: 'community', label: 'Comunidad' },
    { key: 'assistant', label: 'Asistente' },
    { key: 'account', label: 'Cuenta' },
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

  /**
   * Onboarding-completion meter for Overview — same computation the
   * Asistente tab uses for its own counter (utils/personalization-completion.ts),
   * so the two never disagree. Memory is fetched once when Overview loads
   * (see loadSectionData) since it otherwise only populates as a side effect
   * of opening the chatbot or the Asistente tab.
   */
  public readonly personalizationCompletion$ = combineLatest([
    this.profile$,
    this.chatbotService.memory$,
  ]).pipe(map(([profile, memory]) => computePersonalizationCompletion(profile, memory) as PersonalizationCompletion));

  /**
   * Real "for you" recommendations for the Overview rail, reusing the same
   * /discovery/for-you endpoint and CatalogRailComponent that the standalone
   * /para-ti page already uses — see loadSectionData. Left empty (rail
   * hidden) rather than showing placeholder items when there is nothing to
   * recommend yet.
   */
  public forYouItems: CatalogItem[] = [];
  private forYouLoaded = false;

  /**
   * Real public/shared lists for the Community tab, from an endpoint
   * (UserService.fetchCommunityLists -> GET /v2/lists/public) that already
   * existed but was never called from Mi GuíaTV — CommunityListCardComponent
   * was built for this and sat unused. No fabricated placeholder items;
   * hidden entirely when empty (see loadCommunityLists).
   */
  public communityLists: CommunityList[] = [];
  private communityListsLoaded = false;

  public activeTab: TabType = 'overview';
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
    private chatbotService: ChatbotService,
    private catalogService: CatalogService,
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
          this.loadSectionData(mapped);
          return;
        }

        const defaultTab = String(data?.['defaultTab'] || '').trim().toLowerCase();
        const mappedDefault = this.mapLegacyTab(defaultTab);
        if (this.isTabType(mappedDefault)) {
          this.activeTab = mappedDefault;
          this.loadSectionData(mappedDefault);
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
    this.loadSectionData(tab);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab === 'overview' ? null : tab },
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

  onTvPreferencesChange(preferences: UserProfile['tvPreferences']): void {
    this.userService.updateTvPreferences(preferences).subscribe();
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

  private loadSectionData(tab: TabType): void {
    if (tab === 'overview' || tab === 'library') {
      this.userService.fetchLists().subscribe();
      this.userService.fetchFavorites().subscribe();
      this.userService.fetchInteractionHistory().subscribe();
    }
    if (tab === 'overview') {
      // Assistant memory otherwise only loads as a side effect of opening
      // the chatbot or the Asistente tab; Overview's completion meter needs
      // it too. This is a single small document lookup, cheap enough to
      // refetch on every Overview visit without its own cache.
      this.chatbotService.fetchAssistantMemory().subscribe();
      this.loadForYouRail();
      // Overview's "Comunidad" quick-link card shows a real friend count —
      // without this, friends$ stays empty until the user actually opens
      // the Community tab, which would show a misleading "0 amigos".
      this.userService.fetchFriends().subscribe();
    }

    if (tab === 'community' || tab === 'feed' || tab === 'friends') {
      this.userService.fetchFriends().subscribe();
      this.userService.fetchActivities('all').subscribe();
      this.userService.fetchRecommendations('friends').subscribe();
    }
    if (tab === 'community' || tab === 'feed') {
      this.loadCommunityLists();
    }
    if (tab === 'notifications') this.userService.fetchNotifications().subscribe();
  }

  /**
   * Backs the Overview "Esta noche para ti" rail with the same
   * /discovery/for-you data and CatalogRailComponent the standalone /para-ti
   * page already uses (see CatalogService.getForYou and ForYouComponent) —
   * no separate recommendation logic, no fabricated items. The raw response
   * nests the real catalog fields under `.item`; only entries with a usable
   * catalogId/title are kept, and the rail stays hidden entirely if that
   * comes back empty (no login yet, no genres/platforms set, etc.).
   */
  private loadForYouRail(): void {
    if (this.forYouLoaded) return;
    this.forYouLoaded = true;
    this.catalogService.getForYou(6).subscribe({
      next: (recommendations) => {
        this.forYouItems = (recommendations || [])
          .map((recommendation) => recommendation?.item)
          .filter((item): item is CatalogItem => Boolean(item?.catalogId && item?.title));
      },
      error: () => {
        this.forYouItems = [];
      },
    });
  }

  private loadCommunityLists(): void {
    if (this.communityListsLoaded) return;
    this.communityListsLoaded = true;
    this.userService.fetchCommunityLists(6).subscribe({
      next: (lists) => {
        this.communityLists = lists || [];
      },
      error: () => {
        this.communityLists = [];
      },
    });
  }

  private mapLegacyTab(value: string): string {
    if (value === 'social' || value === 'feed' || value === 'community') return 'community';
    if (value === 'overview') return 'overview';
    if (value === 'chat' || value === 'recommendations') return 'assistant';
    // 'streaming'/'notifications' used to be their own nav entries; both
    // rendered the identical <app-user-settings> as 'settings'/'account'.
    // Old bookmarks/links with those query values still land on the single
    // surviving 'account' tab instead of a dead/blank state.
    if (value === 'settings' || value === 'streaming' || value === 'notifications') return 'account';
    if (value === 'lists' || value === 'favorites' || value === 'history') return 'library';
    return value;
  }

  private isTabType(value: string): value is TabType {
    return (
      value === 'overview' || value === 'tv' || value === 'streaming' || value === 'sports' || value === 'library' || value === 'community' || value === 'assistant' || value === 'notifications' || value === 'account' ||
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
