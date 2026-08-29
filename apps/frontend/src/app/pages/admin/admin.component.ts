import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AdminGroupId, AdminNavGroup } from './admin.types';
import { AdminHeaderComponent } from './components/admin-header/admin-header.component';
import { AdminSidebarComponent } from './components/admin-sidebar/admin-sidebar.component';
import { AdminAnalyticsSectionComponent } from './sections/analytics/admin-analytics-section.component';
import { AdminBlogSectionComponent } from './sections/blog/admin-blog-section.component';
import { AdminContentSectionComponent } from './sections/content/admin-content-section.component';
import { AdminOperationsSectionComponent } from './sections/operations/admin-operations-section.component';
import { AdminPlaceholderSectionComponent } from './sections/placeholder/admin-placeholder-section.component';
import { AdminSchedulesSectionComponent } from './sections/schedules/admin-schedules-section.component';
import { AdminSystemSectionComponent } from './sections/system/admin-system-section.component';
import { AdminUsersSectionComponent } from './sections/users/admin-users-section.component';
import { AdminCommunitySectionComponent } from './sections/community/admin-community-section.component';
import { AdminAISectionComponent } from './sections/ai/admin-ai-section.component';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [
    CommonModule,
    AdminSidebarComponent,
    AdminHeaderComponent,
    AdminAnalyticsSectionComponent,
    AdminBlogSectionComponent,
    AdminContentSectionComponent,
    AdminSchedulesSectionComponent,
    AdminOperationsSectionComponent,
    AdminUsersSectionComponent,
    AdminSystemSectionComponent,
    AdminCommunitySectionComponent,
    AdminAISectionComponent,
    AdminPlaceholderSectionComponent,
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent {
  public readonly navGroups: AdminNavGroup[] = [
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'A',
      items: [
        { id: 'overview', label: 'Overview', description: 'KPIs and trends' },
        { id: 'pages', label: 'Pages', description: 'Top content performance' },
        { id: 'live', label: 'Live', description: 'Realtime sessions' },
        { id: 'events', label: 'Events', description: 'Behavior stream' },
        { id: 'journeys', label: 'Journeys', description: 'Flows and funnels', badge: 'Soon' },
        { id: 'retention', label: 'Retention', description: 'Cohorts', badge: 'Soon' },
      ],
    },
    {
      id: 'ai',
      label: 'AI Chatbot',
      icon: '🤖',
      items: [
        { id: 'dashboard', label: 'Dashboard', description: 'KPIs and usage' },
      ],
    },
    {
      id: 'content',
      label: 'Content',
      icon: 'C',
      items: [
        {
          id: 'blog',
          label: 'Blog Studio',
          description: 'Posts, SEO, editorial',
        },
        { id: 'channels', label: 'Channels', description: 'Catalog control' },
        { id: 'programs', label: 'Programs', description: 'Metadata audit' },
        { id: 'categories', label: 'Categories', description: 'Taxonomy' },
        { id: 'assets', label: 'Assets', description: 'Media library' },
        { id: 'layouts', label: 'Layouts', description: 'Home modules' },
      ],
    },
    {
      id: 'schedules',
      label: 'Schedules',
      icon: 'S',
      items: [
        { id: 'epg', label: 'EPG Sync' },
        { id: 'precompute', label: 'Precompute' },
        { id: 'calendar', label: 'Calendar' },
        { id: 'window', label: 'Rolling Window' },
      ],
    },
    {
      id: 'operations',
      label: 'Operations',
      icon: 'O',
      items: [
        { id: 'cache', label: 'Cache' },
        { id: 'jobs', label: 'Jobs' },
        { id: 'alerts', label: 'Alerts' },
        { id: 'logs', label: 'Logs' },
      ],
    },
    {
      id: 'users',
      label: 'Users',
      icon: 'U',
      items: [
        { id: 'accounts', label: 'Accounts & roles', description: 'Account state and access' },
        { id: 'moderation', label: 'Reports', description: 'Moderation queue' },
      ],
    },
    {
      id: 'system',
      label: 'System',
      icon: 'SY',
      items: [
        { id: 'health', label: 'System health', description: 'Service and build status' },
      ],
    },
  ];

  public activeGroup: AdminGroupId = 'analytics';
  public activeItem = 'overview';
  public sidebarOpen = false;
  public lastUpdated: Date | null = null;

  public readonly environmentLabel = environment.production
    ? 'Production'
    : 'Development';

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  selectSection(group: AdminGroupId, item: string): void {
    this.activeGroup = group;
    this.activeItem = item;
    this.sidebarOpen = false;

    const keepsUpdated =
      group === 'analytics' || group === 'users' || group === 'content'
      || group === 'schedules' || group === 'operations' || group === 'system'
      || group === 'community';
    if (!keepsUpdated) {
      this.lastUpdated = null;
    }
  }

  onLastUpdated(date: Date): void {
    this.lastUpdated = date;
  }

  get activeGroupLabel(): string {
    return this.navGroups.find((group) => group.id === this.activeGroup)?.label || '';
  }

  get activeItemLabel(): string {
    const group = this.navGroups.find((item) => item.id === this.activeGroup);
    return group?.items.find((item) => item.id === this.activeItem)?.label || '';
  }

  get activeItemDescription(): string {
    const group = this.navGroups.find((item) => item.id === this.activeGroup);
    return group?.items.find((item) => item.id === this.activeItem)?.description || '';
  }
}
