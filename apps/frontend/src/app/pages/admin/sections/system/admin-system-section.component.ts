import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-system-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-system-section.component.html',
  styleUrls: ['./admin-system-section.component.scss'],
})
export class AdminSystemSectionComponent {
  public readonly statusClasses: Record<string, string> = {
    ok: 'border-emerald-500/40 text-emerald-200 bg-emerald-500/10',
    warning: 'border-amber-500/40 text-amber-200 bg-amber-500/10',
    critical: 'border-red-500/40 text-red-200 bg-red-500/10',
    maintenance: 'border-blue-500/40 text-blue-200 bg-blue-500/10',
  };

  public readonly services = [
    {
      name: 'API Gateway',
      status: 'ok',
      detail: 'Latency 120ms',
      updated: '2m ago',
    },
    {
      name: 'CMS',
      status: 'ok',
      detail: 'Queue stable',
      updated: '4m ago',
    },
    {
      name: 'EPG Sync',
      status: 'warning',
      detail: '2 retries pending',
      updated: '6m ago',
    },
    {
      name: 'Media CDN',
      status: 'ok',
      detail: '99.9% uptime',
      updated: '8m ago',
    },
    {
      name: 'Notification worker',
      status: 'maintenance',
      detail: 'Scheduled patch',
      updated: '30m ago',
    },
  ];

  public readonly flags = [
    {
      name: 'New editorial layout',
      status: 'on',
      owner: 'Product',
    },
    {
      name: 'Realtime analytics v2',
      status: 'off',
      owner: 'Data',
    },
    {
      name: 'EPG fallback provider',
      status: 'on',
      owner: 'Ops',
    },
  ];

  public readonly logs = [
    {
      time: '10:02',
      level: 'warning',
      message: 'Cache node west-2 high evictions.',
    },
    {
      time: '09:44',
      level: 'info',
      message: 'Feature flag update deployed.',
    },
    {
      time: '09:20',
      level: 'error',
      message: 'EPG sync timeout for region BR.',
    },
  ];
}
