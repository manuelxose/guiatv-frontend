import { BrowserContext } from '@playwright/test';

/**
 * Journey 7 (register/login -> profile) intentionally never talks to the
 * shared real backend for auth. That backend (localhost:4000, used
 * read-only elsewhere in this suite) backs real user accounts; creating a
 * throwaway account against it would write real rows to a database this
 * suite doesn't own or get to reset. Per the task brief, we use API-level
 * mocking/interception instead: every /v2/auth/* and /v2/user/* call this
 * journey makes is intercepted and answered with a realistic canned
 * response, so the full client-side flow (form -> session -> profile
 * render) is exercised end-to-end without ever touching real auth/write
 * endpoints or real data.
 */
export const MOCK_USER = {
  id: 'e2e-test-user-id',
  email: 'e2e-playwright-user@example.test',
  name: 'Playwright E2E',
  username: 'playwright_e2e',
  role: 'user' as const,
  picture: '',
};

const AUTH_RESPONSE = {
  user: MOCK_USER,
  accessToken: 'e2e-mock-access-token',
  refreshToken: 'e2e-mock-refresh-token',
  expiresIn: 3600,
  session: { id: 'e2e-mock-session', createdAt: new Date().toISOString() },
};

const MOCK_PROFILE = {
  id: MOCK_USER.id,
  name: MOCK_USER.name,
  username: MOCK_USER.username,
  email: MOCK_USER.email,
  avatar: '',
  bio: '',
  location: '',
  role: 'user',
  favoriteGenres: [],
  preferredPlatforms: [],
  watchingNow: { title: '', mood: '', visibility: 'private' },
  privacy: {},
  notifications: {},
  stats: { followers: 0, following: 0, listsCreated: 0, ratings: 0 },
};

export async function mockAuthBackend(context: BrowserContext): Promise<void> {
  await context.route('**/v2/**', async (route) => {
    const request = route.request();
    const url = request.url();
    const method = request.method();

    if (method === 'POST' && (url.includes('/auth/register') || url.includes('/auth/login'))) {
      return route.fulfill({ json: { success: true, data: AUTH_RESPONSE } });
    }

    if (method === 'GET' && url.includes('/auth/me')) {
      return route.fulfill({ json: { success: true, data: MOCK_USER } });
    }

    if (method === 'GET' && url.includes('/user/profile')) {
      return route.fulfill({ json: { success: true, data: { profile: MOCK_PROFILE } } });
    }

    // Every other /v2/* call the profile page fires (lists, favorites,
    // interactions, notifications, friends, activities, recommendations,
    // watchlist, chat conversations, ...) — safe empty envelope so those
    // widgets render their real empty states instead of erroring.
    return route.fulfill({ json: { success: true, data: [] } });
  });
}
