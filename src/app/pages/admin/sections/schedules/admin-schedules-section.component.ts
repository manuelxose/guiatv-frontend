import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-schedules-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-schedules-section.component.html',
  styleUrls: ['./admin-schedules-section.component.scss'],
})
export class AdminSchedulesSectionComponent {
  public readonly statusClasses: Record<string, string> = {
    synced: 'border-emerald-500/40 text-emerald-200 bg-emerald-500/10',
    warning: 'border-amber-500/40 text-amber-200 bg-amber-500/10',
    failed: 'border-red-500/40 text-red-200 bg-red-500/10',
    running: 'border-blue-500/40 text-blue-200 bg-blue-500/10',
  };

  public readonly channels = [
    {
      name: 'HBO Max',
      region: 'US',
      status: 'synced',
      lastSync: '2m ago',
      errors: 0,
      window: '24h',
    },
    {
      name: 'Discovery',
      region: 'LatAm',
      status: 'warning',
      lastSync: '15m ago',
      errors: 2,
      window: '48h',
    },
    {
      name: 'National Geo',
      region: 'Global',
      status: 'synced',
      lastSync: '6m ago',
      errors: 0,
      window: '24h',
    },
    {
      name: 'Fox Sports',
      region: 'US',
      status: 'failed',
      lastSync: '32m ago',
      errors: 5,
      window: '12h',
    },
  ];

  public readonly syncJobs = [
    {
      name: 'Nightly full sync',
      status: 'running',
      lastRun: 'Today 02:00',
      nextRun: 'Tomorrow 02:00',
      duration: '18m',
    },
    {
      name: 'Incremental updates',
      status: 'synced',
      lastRun: 'Today 09:15',
      nextRun: 'Today 09:30',
      duration: '3m',
    },
    {
      name: 'Rolling window cache',
      status: 'warning',
      lastRun: 'Today 08:40',
      nextRun: 'Today 10:40',
      duration: '7m',
    },
  ];

  public readonly recentLogs = [
    {
      time: '10:21',
      level: 'warning',
      message: 'EPG row missing start time for FOX-SPORTS-3.',
    },
    {
      time: '10:10',
      level: 'info',
      message: 'Incremental sync completed for 142 channels.',
    },
    {
      time: '09:58',
      level: 'error',
      message: 'Timeout while fetching partner metadata (region BR).',
    },
  ];
}
