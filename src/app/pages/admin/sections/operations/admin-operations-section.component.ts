import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-operations-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-operations-section.component.html',
  styleUrls: ['./admin-operations-section.component.scss'],
})
export class AdminOperationsSectionComponent {
  public readonly jobStatusClasses: Record<string, string> = {
    running: 'border-blue-500/40 text-blue-200 bg-blue-500/10',
    queued: 'border-slate-500/40 text-slate-200 bg-slate-500/10',
    failed: 'border-red-500/40 text-red-200 bg-red-500/10',
    completed: 'border-emerald-500/40 text-emerald-200 bg-emerald-500/10',
  };

  public readonly jobs = [
    {
      name: 'Cache rebuild',
      status: 'running',
      owner: 'Scheduler',
      updated: '2m ago',
    },
    {
      name: 'Metadata enrichment',
      status: 'queued',
      owner: 'ETL',
      updated: '5m ago',
    },
    {
      name: 'Thumbnail regeneration',
      status: 'completed',
      owner: 'Media',
      updated: '12m ago',
    },
    {
      name: 'EPG retry queue',
      status: 'failed',
      owner: 'EPG',
      updated: '18m ago',
    },
  ];

  public readonly alerts = [
    {
      severity: 'critical',
      title: 'EPG mismatch detected',
      detail: 'Channel FOX-SPORTS-3 missing 4 slots.',
    },
    {
      severity: 'warning',
      title: 'High cache evictions',
      detail: 'Cache node west-2 hit 82% eviction.',
    },
    {
      severity: 'info',
      title: 'Nightly sync completed',
      detail: '142 channels processed successfully.',
    },
  ];
}
