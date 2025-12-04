import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import {
  UserActivity,
  UserFriend,
  UserListItem,
  UserProfile,
  UserRecommendation,
  UserNotifications,
  UserPrivacy,
  WatchingNow,
  UserList,
  Top10Category,
  Top10Item,
  NewsItem,
} from '../interfaces/user.interface';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly isBrowser = typeof window !== 'undefined';
  private profileSubject = new BehaviorSubject<UserProfile>(INITIAL_PROFILE);
  private recommendationsSubject = new BehaviorSubject<UserRecommendation[]>(
    INITIAL_RECOMMENDATIONS
  );
  private activitiesSubject = new BehaviorSubject<UserActivity[]>(
    INITIAL_ACTIVITIES
  );
  private friendsSubject = new BehaviorSubject<UserFriend[]>(INITIAL_FRIENDS);
  private watchlistSubject = new BehaviorSubject<UserListItem[]>(
    INITIAL_WATCHLIST
  );
  private listsSubject = new BehaviorSubject<UserList[]>(INITIAL_LISTS);
  private top10Subject = new BehaviorSubject<Top10Category[]>(INITIAL_TOP10_CATEGORIES);
  private newsSubject = new BehaviorSubject<NewsItem[]>(INITIAL_NEWS);
  private authenticatedSubject = new BehaviorSubject<boolean>(false);

  public readonly isAuthenticated$ = this.authenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = this.safeGetToken();
    if (token) {
      this.fetchProfileFromApi(token).subscribe();
    }
  }

  getProfile(): Observable<UserProfile> {
    return this.profileSubject.asObservable();
  }

  getRecommendations(): Observable<UserRecommendation[]> {
    return this.recommendationsSubject.asObservable();
  }

  getActivities(): Observable<UserActivity[]> {
    return this.activitiesSubject.asObservable();
  }

  getFriends(): Observable<UserFriend[]> {
    return this.friendsSubject.asObservable();
  }

  getWatchlist(): Observable<UserListItem[]> {
    return this.watchlistSubject.asObservable();
  }

  getLists(): Observable<UserList[]> {
    return this.listsSubject.asObservable();
  }

  getTop10(): Observable<Top10Category[]> {
    return this.top10Subject.asObservable();
  }

  getNews(): Observable<NewsItem[]> {
    return this.newsSubject.asObservable();
  }

  /**
   * Refresca perfil real desde backend (autenticación por Google idToken)
   */
  fetchProfileFromApi(token: string): Observable<UserProfile | null> {
    if (!token) return of(null);

    const url = `${environment.API_BASE_URL}/auth/me`;
    return this.http
      .get<{ success: boolean; data: Partial<UserProfile> }>(url, {
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
      })
      .pipe(
        // Actualiza estado si llega info válida
        tapIfProfile((data) => {
          this.applySession(
            {
              id: data.id || data.email || 'user',
              name: data.name || data.email || 'Usuario',
              email: data.email || '',
              username: data.username || data.email?.split('@')[0] || 'user',
              avatar: data.avatar || '/assets/gpt-avatar.png',
              bio: data.bio || 'Comparte tus pelis y series favoritas.',
              location: data.location || '—',
              favoriteGenres: data.favoriteGenres || [],
              watchingNow: data.watchingNow || INITIAL_PROFILE.watchingNow,
              privacy: data.privacy || INITIAL_PROFILE.privacy,
              notifications: data.notifications || INITIAL_PROFILE.notifications,
              stats: data.stats || INITIAL_PROFILE.stats,
            },
            token
          );
        })
      );
  }

  applySession(user: Partial<UserProfile>, token: string): void {
    const current = this.profileSubject.value;
    const merged: UserProfile = {
      ...current,
      ...user,
      privacy: { ...current.privacy, ...(user.privacy || {}) },
      notifications: { ...current.notifications, ...(user.notifications || {}) },
      watchingNow: { ...current.watchingNow, ...(user.watchingNow || {}) },
      favoriteGenres: user.favoriteGenres || current.favoriteGenres,
      stats: { ...current.stats, ...(user.stats || {}) },
    };

    this.profileSubject.next(merged);
    this.authenticatedSubject.next(true);
    if (token && this.isBrowser) {
      try {
        localStorage.setItem('gtv_id_token', token);
      } catch {
        // ignore storage errors (SSR / private mode)
      }
    }
  }

  logout(): void {
    if (this.isBrowser) {
      try {
        localStorage.removeItem('gtv_id_token');
      } catch {
        // ignore
      }
    }
    this.authenticatedSubject.next(false);
  }

  updateProfile(data: Partial<UserProfile>): void {
    const current = this.profileSubject.value;
    this.profileSubject.next({
      ...current,
      ...data,
      privacy: { ...current.privacy, ...(data.privacy || {}) },
      notifications: {
        ...current.notifications,
        ...(data.notifications || {}),
      },
      watchingNow: { ...current.watchingNow, ...(data.watchingNow || {}) },
    });
  }

  updatePrivacy(privacy: Partial<UserPrivacy>): void {
    const profile = this.profileSubject.value;
    this.profileSubject.next({
      ...profile,
      privacy: { ...profile.privacy, ...(privacy || {}) },
    });
  }

  updateNotifications(notifications: Partial<UserNotifications>): void {
    const profile = this.profileSubject.value;
    this.profileSubject.next({
      ...profile,
      notifications: { ...profile.notifications, ...(notifications || {}) },
    });
  }

  updateWatchingNow(data: Partial<WatchingNow>): void {
    const profile = this.profileSubject.value;
    this.profileSubject.next({
      ...profile,
      watchingNow: { ...profile.watchingNow, ...(data || {}) },
    });

    if (data.title) {
      this.pushActivity({
        id: this.generateId(),
        type: 'status',
        title: 'Nuevo estado',
        description: `Ahora viendo: ${data.title}`,
        createdAt: 'Hace un momento',
        badge: data.visibility === 'private' ? 'Privado' : 'Compartido',
      });
    }
  }

  addRecommendation(payload: Partial<UserRecommendation>): void {
    const newRecommendation: UserRecommendation = {
      id: this.generateId(),
      title: payload.title || 'Sin título',
      type: payload.type || 'movie',
      note: payload.note || '',
      tags: payload.tags || [],
      visibility: payload.visibility || 'friends',
      status: payload.status || 'finished',
      rating: payload.rating,
      createdAt: 'Hace un momento',
      mood: payload.mood || 'Entusiasmado',
      platform: payload.platform || 'Streaming',
      likes: 0,
      comments: 0
    };

    this.recommendationsSubject.next([
      newRecommendation,
      ...this.recommendationsSubject.value,
    ]);

    this.updateStats({
      recommendations: this.profileSubject.value.stats.recommendations + 1,
    });

    this.pushActivity({
      id: this.generateId(),
      type: 'recommendation',
      title: 'Nueva recomendación',
      description: `${newRecommendation.title} (${newRecommendation.type})`,
      createdAt: 'Ahora',
      badge: newRecommendation.visibility === 'public' ? 'Pública' : 'Amigos',
    });
  }

  toggleFollow(friendId: string): void {
    const friends = this.friendsSubject.value.map((friend) =>
      friend.id === friendId
        ? { ...friend, following: !friend.following }
        : friend
    );
    this.friendsSubject.next(friends);

    const delta = friends.find((f) => f.id === friendId)?.following ? 1 : -1;
    this.updateStats({
      following: Math.max(
        0,
        this.profileSubject.value.stats.following + delta
      ),
    });
  }

  updateListItemState(id: string, state: UserListItem['state']): void {
    const list = this.watchlistSubject.value.map((item) =>
      item.id === id ? { ...item, state } : item
    );
    this.watchlistSubject.next(list);

    this.pushActivity({
      id: this.generateId(),
      type: 'list',
      title: 'Lista actualizada',
      description: `Has marcado "${list.find((i) => i.id === id)?.title || ''}" como ${state}.`,
      createdAt: 'Ahora',
    });
  }

  addListItem(listId: string, item: { title: string; type: 'movie' | 'series'; state: 'pending' | 'watching' | 'finished' }): void {
    const newItem: UserListItem = {
      id: this.generateId(),
      title: item.title,
      type: item.type,
      state: item.state,
      progress: 0,
      visibility: 'public',
      poster: '/assets/default-poster.jpg' // Mock poster
    };

    // In a real app, we would add to the specific list
    const currentList = this.watchlistSubject.value;
    this.watchlistSubject.next([newItem, ...currentList]);

    this.pushActivity({
      id: this.generateId(),
      type: 'list',
      title: 'Elemento añadido',
      description: `Has añadido "${item.title}" a tu lista`,
      createdAt: 'Ahora',
    });
  }

  removeListItem(listId: string, itemId: string): void {
    // In a real app, this would make an API call
    // For now, we'll just update the local state if it's the watchlist
    // or we would need to manage items per list in a more complex mock
    
    // Assuming we are removing from the main watchlist for now as that's what getWatchlist returns
    const currentList = this.watchlistSubject.value;
    const updatedList = currentList.filter(item => item.id !== itemId);
    this.watchlistSubject.next(updatedList);

    this.pushActivity({
      id: this.generateId(),
      type: 'list',
      title: 'Elemento eliminado',
      description: 'Has eliminado un elemento de tu lista',
      createdAt: 'Ahora',
    });
  }

  createList(data: { title: string; description: string; visibility: 'public' | 'friends' | 'private' }): void {
    const newList: UserList = {
      id: this.generateId(),
      title: data.title,
      description: data.description,
      itemsCount: 0,
      visibility: data.visibility,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    this.listsSubject.next([newList, ...this.listsSubject.value]);

    this.pushActivity({
      id: this.generateId(),
      type: 'list',
      title: 'Nueva lista creada',
      description: `Has creado la lista "${data.title}"`,
      createdAt: 'Ahora',
    });
  }


  private updateStats(stats: Partial<UserProfile['stats']>): void {
    const profile = this.profileSubject.value;
    this.profileSubject.next({
      ...profile,
      stats: { ...profile.stats, ...(stats || {}) },
    });
  }

  private pushActivity(activity: UserActivity): void {
    this.activitiesSubject.next([activity, ...this.activitiesSubject.value]);
  }

  private generateId(): string {
    return `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  private safeGetToken(): string | null {
    if (!this.isBrowser) return null;
    try {
      return localStorage.getItem('gtv_id_token');
    } catch {
      return null;
    }
  }
}

function tapIfProfile(fn: (profile: Partial<UserProfile>) => void) {
  return (source: Observable<any>) =>
    new Observable<any>((subscriber) => {
      return source.subscribe({
        next: (resp) => {
          try {
            const profile = resp?.data || resp;
            if (profile) fn(profile);
            subscriber.next(resp);
          } catch (e) {
            subscriber.error(e);
          }
        },
        error: (err) => subscriber.error(err),
        complete: () => subscriber.complete(),
      });
    });
}

const INITIAL_PROFILE: UserProfile = {
  id: 'user-01',
  name: 'Marina González',
  username: 'marina.gtv',
  email: 'marina@guiatv.app',
  avatar: '/assets/gpt-avatar.png',
  bio: 'Amante del cine y las series. Comparto lo que veo para que no te pierdas nada.',
  location: 'Madrid, España',
  favoriteGenres: ['Sci-Fi', 'Drama', 'Thriller', 'Comedia'],
  watchingNow: {
    title: 'The Bear - Temporada 3',
    mood: 'Enganchada',
    visibility: 'friends',
  },
  privacy: {
    profilePublic: true,
    shareActivity: true,
    shareWatchlist: true,
    showOnline: true,
    allowMessages: 'all',
    publicLists: true
  },
  notifications: {
    recommendations: true,
    followers: true,
    weeklySummary: false,
    chatMessages: true,
    groupActivity: true
  },
  stats: {
    followers: 48,
    following: 32,
    recommendations: 14,
    watchlist: 18,
    listsCreated: 5,
    ratings: 23
  },
};

const INITIAL_RECOMMENDATIONS: UserRecommendation[] = [
  {
    id: 'rec-01',
    title: 'Dune: Parte Dos',
    type: 'movie',
    note: 'Visualmente brutal, merece la pena en pantalla grande.',
    tags: ['Ciencia ficción', 'Épica'],
    visibility: 'public',
    status: 'finished',
    rating: 9.5,
    createdAt: 'Hace 1 día',
    mood: 'Entusiasmada',
    platform: 'Cine / HBO Max',
    likes: 12,
    comments: 3
  },
  {
    id: 'rec-02',
    title: 'Severance',
    type: 'series',
    note: 'Mind-blowing. Si te gusta Black Mirror, ve directo.',
    tags: ['Thriller', 'Sci-Fi'],
    visibility: 'friends',
    status: 'watching',
    rating: 9.2,
    createdAt: 'Hace 3 días',
    mood: 'Intrigada',
    platform: 'Apple TV+',
    likes: 8,
    comments: 1
  },
  {
    id: 'rec-03',
    title: 'The Bear',
    type: 'series',
    note: 'Personajes increíbles y ritmo perfecto para maratón.',
    tags: ['Drama', 'Cocina'],
    visibility: 'friends',
    status: 'watching',
    rating: 8.9,
    createdAt: 'Hace 5 días',
    mood: 'Intensa',
    platform: 'Disney+',
    likes: 24,
    comments: 5
  },
];

const INITIAL_ACTIVITIES: UserActivity[] = [
  {
    id: 'act-01',
    type: 'status',
    title: 'Ahora viendo',
    description: 'Ha empezado "The Bear - T3" y va por el episodio 2.',
    createdAt: 'Hace 15 min',
    badge: 'En vivo',
    category: 'series',
  },
  {
    id: 'act-02',
    type: 'recommendation',
    title: 'Nueva reseña',
    description: 'Recomendó "Dune: Parte Dos" con 9.5/10.',
    createdAt: 'Hace 1 hora',
    badge: 'Cine',
    category: 'peliculas',
  },
  {
    id: 'act-03',
    type: 'follow',
    title: 'Sigue a @seriefilo',
    description: 'Ahora sigues a Laura y recibirás sus listas.',
    createdAt: 'Hace 3 horas',
    badge: 'Comunidad',
    category: 'social',
  },
];

const INITIAL_FRIENDS: UserFriend[] = [
  {
    id: 'friend-01',
    name: 'Carlos Méndez',
    username: 'carlos.m',
    avatar: '/assets/gpt-avatar.png',
    isOnline: true,
    lastActivity: 'Viendo "Silo"',
    favoriteGenres: ['Sci-Fi', 'Acción'],
    following: true,
  },
  {
    id: 'friend-02',
    name: 'Laura Serrano',
    username: 'seriefilo',
    avatar: '/assets/gpt-avatar.png',
    isOnline: false,
    lastActivity: 'Terminó "The Morning Show"',
    favoriteGenres: ['Drama', 'Documental'],
    following: false,
  },
  {
    id: 'friend-03',
    name: 'Andrés Blanco',
    username: 'andresb',
    avatar: '/assets/gpt-avatar.png',
    isOnline: true,
    lastActivity: 'Comentó "Dune"',
    favoriteGenres: ['Sci-Fi', 'Fantasia'],
    following: true,
  },
];

const INITIAL_WATCHLIST: UserListItem[] = [
  {
    id: 'list-01',
    title: 'The Bear - Temporada 3',
    type: 'series',
    state: 'watching',
    progress: 45,
    mood: 'Intensa',
    visibility: 'friends',
  },
  {
    id: 'list-02',
    title: 'Dune: Parte Dos',
    type: 'movie',
    state: 'finished',
    progress: 100,
    mood: 'Épica',
    visibility: 'public',
  },
  {
    id: 'list-03',
    title: 'Arcane - Temporada 2',
    type: 'series',
    state: 'pending',
    progress: 0,
    visibility: 'friends',
  },
  {
    id: 'list-04',
    title: 'The Creator',
    type: 'movie',
    state: 'pending',
    progress: 0,
    visibility: 'private',
  },
];

const INITIAL_LISTS: UserList[] = [
  {
    id: 'pending-list',
    title: 'Pendientes de ver',
    description: 'Mi lista por defecto para guardar lo que quiero ver.',
    itemsCount: 2,
    visibility: 'private',
    createdAt: '2024-01-01',
    updatedAt: '2024-03-15',
    cover: '/assets/covers/pending.jpg',
    isDefault: true
  },
  {
    id: 'l-01',
    title: 'Favoritas de Sci-Fi',
    description: 'Mis películas favoritas del género.',
    itemsCount: 12,
    visibility: 'public',
    createdAt: '2024-01-15',
    updatedAt: '2024-03-10',
    cover: '/assets/covers/scifi.jpg'
  },
  {
    id: 'l-02',
    title: 'Maratón de fin de semana',
    description: 'Para ver con amigos.',
    itemsCount: 5,
    visibility: 'friends',
    createdAt: '2024-03-01',
    updatedAt: '2024-03-01',
  }
];

const INITIAL_TOP10_CATEGORIES: Top10Category[] = [
  {
    id: 'top-movies',
    title: 'Top Películas',
    items: [
      {
        id: 't-01',
        title: 'Dune: Parte Dos',
        image: '/assets/posters/dune2.jpg',
        rank: 1,
        change: 'same',
        type: 'movie',
        rating: 9.5
      },
      {
        id: 't-04',
        title: 'Oppenheimer',
        image: '/assets/posters/oppenheimer.jpg',
        rank: 2,
        change: 'down',
        type: 'movie',
        rating: 9.4
      }
    ]
  },
  {
    id: 'top-series',
    title: 'Top Series',
    items: [
      {
        id: 't-02',
        title: 'Shogun',
        image: '/assets/posters/shogun.jpg',
        rank: 1,
        change: 'up',
        type: 'series',
        rating: 9.3
      },
      {
        id: 't-03',
        title: 'The Bear',
        image: '/assets/posters/bear.jpg',
        rank: 2,
        change: 'down',
        type: 'series',
        rating: 9.0
      }
    ]
  }
];

const INITIAL_NEWS: NewsItem[] = [
  {
    id: 'n-01',
    title: 'Estreno de "House of the Dragon" T2',
    summary: 'Todo lo que necesitas saber antes del estreno.',
    image: '/assets/news/hotd.jpg',
    date: 'Hace 2 horas',
    read: false,
    category: 'Estrenos'
  },
  {
    id: 'n-02',
    title: 'Nuevas funciones en la app',
    summary: 'Ahora puedes crear listas colaborativas con amigos.',
    image: '/assets/news/update.jpg',
    date: 'Hace 1 día',
    read: true,
    category: 'App'
  }
];
