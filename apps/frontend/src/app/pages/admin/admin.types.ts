export type AdminGroupId =
  | 'analytics'
  | 'ai'
  | 'content'
  | 'schedules'
  | 'users'
  | 'community'
  | 'growth'
  | 'monetization'
  | 'operations'
  | 'system'
  | 'settings'
  | 'support';

export interface AdminNavItem {
  id: string;
  label: string;
  description?: string;
  badge?: string;
}

export interface AdminNavGroup {
  id: AdminGroupId;
  label: string;
  icon: string;
  items: AdminNavItem[];
}
