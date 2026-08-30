import { BrowserContext } from '@playwright/test';

/**
 * Phase 9 Affiliate/Monetization admin UI journey. Like `auth-mock.ts`
 * (see its header comment for the rationale), this never touches the real
 * shared backend/database for anything admin-write-shaped: `/v2/user/profile`
 * and every `/v2/admin/affiliate/*` call are intercepted and answered with a
 * realistic canned response, so the full client-side render + interaction
 * flow is exercised end-to-end (real Angular app, real browser, real DOM)
 * without writing a throwaway admin session or commercial-config row into a
 * database this suite doesn't own.
 */
export const MOCK_ADMIN_PROFILE = {
  id: 'e2e-admin-user-id',
  name: 'Playwright Admin',
  username: 'playwright_admin',
  email: 'e2e-playwright-admin@example.test',
  avatar: '',
  bio: '',
  location: '',
  role: 'admin',
  favoriteGenres: [],
  preferredPlatforms: [],
  watchingNow: { title: '', mood: '', visibility: 'private' },
  privacy: {},
  notifications: {},
  stats: { followers: 0, following: 0, listsCreated: 0, ratings: 0 },
};

const MERCHANTS = [
  {
    id: 'merchant-1',
    slug: 'movistar-plus',
    canonicalProviderKey: 'movistar-plus',
    name: 'Movistar Plus+',
    aliases: ['movistar+', 'm+'],
    logo: '',
    category: 'streaming',
    officialUrl: 'https://www.movistarplus.es',
    markets: ['ES'],
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'merchant-2',
    slug: 'dazn',
    canonicalProviderKey: 'dazn',
    name: 'DAZN',
    aliases: ['dazn f1'],
    logo: '',
    category: 'streaming',
    officialUrl: 'https://www.dazn.com',
    markets: ['ES'],
    status: 'pending',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
];

const NETWORKS = [
  {
    id: 'network-1',
    slug: 'awin',
    name: 'AWIN',
    trackingType: 'url_template',
    markets: ['ES'],
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
];

const PROGRAMS = [
  {
    id: 'program-1',
    merchantId: 'merchant-1',
    networkId: 'network-1',
    market: 'ES',
    relationship: 'affiliate_configured',
    status: 'active',
    allowedHosts: ['tienda.movistarplus.es'],
    disclosure: 'Este enlace es de afiliado.',
    secretRefName: 'AWIN_MOVISTAR_TOKEN',
    secretStatus: 'configured',
    verification: { status: 'approved', verifiedAt: '2026-08-01T00:00:00.000Z' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'program-2',
    merchantId: 'merchant-2',
    networkId: 'network-1',
    market: 'ES',
    relationship: 'manual_agreement_required',
    status: 'pending',
    allowedHosts: ['tienda.dazn.com'],
    disclosure: 'Este enlace es de afiliado.',
    secretRefName: 'AWIN_DAZN_TOKEN',
    secretStatus: 'missing',
    verification: { status: 'needs_review' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
];

const OFFERS = [
  {
    id: 'offer-1',
    merchantId: 'merchant-1',
    affiliateProgramId: 'program-1',
    market: 'ES',
    category: 'streaming',
    plan: { id: 'basico', name: 'Plan Básico' },
    pricing: {
      currency: 'EUR',
      monthlyAmount: 9.99,
      annualAmount: null,
      monthlyLabel: '9,99€/mes',
      annualLabel: '',
      activationFeeAmount: null,
    },
    features: {},
    requirements: { commitmentMonths: 0, fibreRequired: false, mobileRequired: false, device: null },
    trial: { days: null },
    recommendationIntents: ['cheapest'],
    placements: [],
    destination: { strategy: 'direct_url', url: 'https://tienda.movistarplus.es/basico' },
    validity: {},
    status: 'active',
    verification: { status: 'current', verifiedAt: '2026-08-20T00:00:00.000Z' },
    display: { disclosure: 'Este enlace es de afiliado.' },
    expired: false,
    verificationDisplay: 'current',
    daysSinceVerified: 9,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'offer-2',
    merchantId: 'merchant-2',
    affiliateProgramId: 'program-2',
    market: 'ES',
    category: 'streaming',
    plan: { id: 'anual', name: 'Plan Anual (expirado)' },
    pricing: {
      currency: 'EUR',
      monthlyAmount: null,
      annualAmount: 199,
      monthlyLabel: '',
      annualLabel: '199€/año',
      activationFeeAmount: null,
    },
    features: {},
    requirements: { commitmentMonths: 12, fibreRequired: false, mobileRequired: false, device: null },
    trial: { days: null },
    recommendationIntents: [],
    placements: [],
    destination: { strategy: 'direct_url', url: 'https://tienda.dazn.com/anual' },
    validity: { validUntil: '2026-01-01T00:00:00.000Z' },
    status: 'active',
    verification: { status: 'current', verifiedAt: '2026-01-01T00:00:00.000Z' },
    display: { disclosure: 'Este enlace es de afiliado.' },
    expired: true,
    verificationDisplay: 'stale',
    daysSinceVerified: 240,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const PLACEMENTS = [
  { id: 'placement-1', key: 'home', page: '/', description: 'Home highlights', enabled: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  { id: 'placement-2', key: 'channel-page', page: '/canal/:slug', description: 'Channel page', enabled: false, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
];

const VERIFICATION_ITEMS = [
  {
    entityType: 'offer',
    entityId: 'offer-2',
    merchantId: 'merchant-2',
    merchantName: 'DAZN',
    label: 'DAZN — Plan Anual (expirado) (ES)',
    market: 'ES',
    sourceUrl: 'https://www.dazn.com/precios',
    verifiedAt: '2026-01-01T00:00:00.000Z',
    daysSinceVerified: 240,
    displayStatus: 'stale',
  },
  {
    entityType: 'program',
    entityId: 'program-2',
    merchantId: 'merchant-2',
    merchantName: 'DAZN',
    label: 'DAZN — AWIN (ES)',
    market: 'ES',
    daysSinceVerified: null,
    displayStatus: 'needs_review',
  },
  {
    entityType: 'offer',
    entityId: 'offer-1',
    merchantId: 'merchant-1',
    merchantName: 'Movistar Plus+',
    label: 'Movistar Plus+ — Plan Básico (ES)',
    market: 'ES',
    sourceUrl: 'https://www.movistarplus.es/precios',
    verifiedAt: '2026-08-20T00:00:00.000Z',
    daysSinceVerified: 9,
    displayStatus: 'current',
  },
];

const ANALYTICS_REPORT = {
  range: { from: '2026-07-30T00:00:00.000Z', to: '2026-08-29T00:00:00.000Z' },
  totals: { impressions: 420, clicks: 37, ctr: 8.81 },
  byMerchant: [
    { key: 'merchant-1', label: 'Movistar Plus+', impressions: 300, clicks: 28, ctr: 9.33 },
    { key: 'merchant-2', label: 'DAZN', impressions: 120, clicks: 9, ctr: 7.5 },
  ],
  byPlacement: [
    { key: 'home', label: 'home', impressions: 250, clicks: 20, ctr: 8 },
    { key: 'channel-page', label: 'channel-page', impressions: 170, clicks: 17, ctr: 10 },
  ],
  byOffer: [{ key: 'offer-1', label: 'Plan Básico (ES)', impressions: 300, clicks: 28, ctr: 9.33 }],
  topContent: [{ contentType: 'channel', contentId: 'la-1', clicks: 12, impressions: 90 }],
  note: 'Clicks and impressions only — the Affiliate Engine has no network revenue/conversion feed, so revenue is never shown or estimated here.',
};

function json(data: unknown) {
  return { json: { success: true, data } };
}

export async function mockAdminAffiliateBackend(context: BrowserContext): Promise<void> {
  await context.route('**/v2/**', async (route) => {
    const request = route.request();
    const url = request.url();
    const method = request.method();

    if (method === 'GET' && url.includes('/user/profile')) {
      return route.fulfill(json({ profile: MOCK_ADMIN_PROFILE }));
    }

    if (url.includes('/admin/affiliate/merchants')) {
      if (method === 'POST') {
        const body = request.postDataJSON() || {};
        return route.fulfill(json({ merchant: { id: 'merchant-new', ...body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }));
      }
      if (method === 'PUT') {
        const body = request.postDataJSON() || {};
        return route.fulfill(json({ merchant: { id: 'merchant-1', ...body, updatedAt: new Date().toISOString() } }));
      }
      return route.fulfill(json({ merchants: MERCHANTS }));
    }

    if (url.includes('/admin/affiliate/networks')) {
      if (method === 'POST' || method === 'PUT') {
        const body = request.postDataJSON() || {};
        return route.fulfill(json({ network: { id: 'network-1', ...body, updatedAt: new Date().toISOString() } }));
      }
      return route.fulfill(json({ networks: NETWORKS }));
    }

    if (url.includes('/admin/affiliate/programs')) {
      if (method === 'POST' || method === 'PUT') {
        const body = request.postDataJSON() || {};
        return route.fulfill(json({ program: { id: 'program-1', secretStatus: 'not_applicable', ...body, updatedAt: new Date().toISOString() } }));
      }
      return route.fulfill(json({ programs: PROGRAMS }));
    }

    if (url.includes('/admin/affiliate/offers')) {
      if (url.includes('/deactivate')) {
        return route.fulfill(json({ offer: { ...OFFERS[0], status: 'inactive' } }));
      }
      if (method === 'POST' || method === 'PUT') {
        const body = request.postDataJSON() || {};
        return route.fulfill(json({ offer: { id: 'offer-1', expired: false, verificationDisplay: 'needs_review', daysSinceVerified: null, ...body, updatedAt: new Date().toISOString() } }));
      }
      return route.fulfill(json({ offers: OFFERS, total: OFFERS.length }));
    }

    if (url.includes('/admin/affiliate/placements')) {
      if (method === 'POST' || method === 'PUT') {
        const body = request.postDataJSON() || {};
        return route.fulfill(json({ placement: { id: 'placement-new', ...body, updatedAt: new Date().toISOString() } }));
      }
      return route.fulfill(json({ placements: PLACEMENTS }));
    }

    if (url.includes('/admin/affiliate/verification')) {
      return route.fulfill(json({ items: VERIFICATION_ITEMS }));
    }

    if (url.includes('/admin/affiliate/analytics')) {
      return route.fulfill(json(ANALYTICS_REPORT));
    }

    // Every other /v2/* call the admin shell fires on load (the default
    // Analytics-Overview tab, header "last updated" pings, ...) — safe empty
    // envelope so those widgets render their real empty states instead of
    // erroring, mirroring auth-mock.ts's fallback.
    return route.fulfill({ json: { success: true, data: [] } });
  });
}
