import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, OnDestroy, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  AdminContentService,
  AdminContentChannel,
  AdminContentProgram,
} from '../../../../services/admin-content.service';

@Component({
  selector: 'app-admin-content-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-content-section.component.html',
  styleUrls: ['./admin-content-section.component.scss'],
})
export class AdminContentSectionComponent implements OnInit, OnDestroy {
  @Input() activeItem = 'channels';
  @Output() lastUpdatedChange = new EventEmitter<Date>();

  channels: AdminContentChannel[] = [];
  programs: AdminContentProgram[] = [];
  programsTotal = 0;
  loading = false;
  error = '';

  /* filters */
  searchTerm = '';
  programDate = '';
  programPage = 1;
  programLimit = 25;

  /* genre aggregation for "categories" view */
  genres: { genre: string; count: number }[] = [];

  private subs = new Subscription();

  private readonly viewLabels: Record<string, { title: string; description: string }> = {
    channels: { title: 'Channels', description: 'Browse the channel catalog sourced from EPG data.' },
    programs: { title: 'Programs', description: 'Explore program data, images, and category mapping.' },
    categories: { title: 'Categories', description: 'Genre breakdown derived from program metadata.' },
    assets: { title: 'Assets', description: 'Central library for posters, logos, and banners.' },
    layouts: { title: 'Layouts', description: 'Tune home modules and editorial layouts.' },
  };

  constructor(private contentService: AdminContentService) {}

  get viewTitle(): string {
    return this.viewLabels[this.activeItem]?.title || 'Content';
  }

  get viewDescription(): string {
    return this.viewLabels[this.activeItem]?.description || 'Manage content.';
  }

  get filteredChannels(): AdminContentChannel[] {
    if (!this.searchTerm) return this.channels;
    const q = this.searchTerm.toLowerCase();
    return this.channels.filter(
      (c) => c.name.toLowerCase().includes(q) || c.type?.toLowerCase().includes(q)
    );
  }

  get filteredPrograms(): AdminContentProgram[] {
    if (!this.searchTerm) return this.programs;
    const q = this.searchTerm.toLowerCase();
    return this.programs.filter(
      (p) => p.title.toLowerCase().includes(q) || p.genre?.toLowerCase().includes(q)
    );
  }

  ngOnInit(): void {
    this.loadChannels();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadChannels(): void {
    this.loading = true;
    this.error = '';
    this.subs.add(
      this.contentService.getChannels().subscribe({
        next: (data) => {
          this.channels = data;
          this.loading = false;
          this.lastUpdatedChange.emit(new Date());
        },
        error: (err) => {
          this.error = err?.message || 'Failed to load channels';
          this.loading = false;
        },
      })
    );
  }

  loadPrograms(): void {
    this.loading = true;
    this.error = '';
    this.subs.add(
      this.contentService
        .getPrograms({
          date: this.programDate || undefined,
          page: this.programPage,
          limit: this.programLimit,
          fields: 'full',
        })
        .subscribe({
          next: (resp) => {
            this.programs = resp.programs;
            this.programsTotal = resp.total ?? resp.programs.length;
            this.buildGenres(resp.programs);
            this.loading = false;
            this.lastUpdatedChange.emit(new Date());
          },
          error: (err) => {
            this.error = err?.message || 'Failed to load programs';
            this.loading = false;
          },
        })
    );
  }

  onActiveItemChange(): void {
    this.searchTerm = '';
    this.error = '';
    if (this.activeItem === 'programs' || this.activeItem === 'categories') {
      if (!this.programs.length) this.loadPrograms();
    }
    if (this.activeItem === 'channels' && !this.channels.length) {
      this.loadChannels();
    }
  }

  prevPage(): void {
    if (this.programPage > 1) {
      this.programPage--;
      this.loadPrograms();
    }
  }

  nextPage(): void {
    this.programPage++;
    this.loadPrograms();
  }

  private buildGenres(programs: AdminContentProgram[]): void {
    const map = new Map<string, number>();
    for (const p of programs) {
      const g = p.genre || 'Unknown';
      map.set(g, (map.get(g) || 0) + 1);
    }
    this.genres = Array.from(map.entries())
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count);
  }
}
