import { Params } from '@angular/router';

export interface UnifiedPortalMetric {
  label: string;
  value: string;
  detail: string;
  iconPath: string;
}

export type UnifiedPortalRailActionId = 'assistant';
export type UnifiedPortalHeroVariant = 'default' | 'stage' | 'compact';
export type UnifiedPortalRightRailVariant = 'default' | 'prime';
export type UnifiedPortalRailSectionVariant = 'default' | 'feature' | 'logos' | 'compact';

export interface UnifiedPortalRailItem {
  id: string;
  label: string;
  description?: string;
  value?: string;
  badge?: string;
  iconPath?: string;
  imageUrl?: string;
  path?: string;
  queryParams?: Params;
  active?: boolean;
  actionId?: UnifiedPortalRailActionId;
}

export interface UnifiedPortalRailSection {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  variant?: UnifiedPortalRailSectionVariant;
  items: readonly UnifiedPortalRailItem[];
  actionLabel?: string;
  actionPath?: string;
  actionQueryParams?: Params;
}

export interface PortalFeatureBlock {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  accent?: 'live' | 'discover' | 'streaming' | 'sports' | 'editorial';
}

export interface PortalFeedSection<T = unknown> {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  linkLabel?: string;
  linkPath?: string;
  items: readonly T[];
}

export interface PortalDirectorySection {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  items: readonly UnifiedPortalRailItem[];
}

export type PortalContextRailSection = UnifiedPortalRailSection;
