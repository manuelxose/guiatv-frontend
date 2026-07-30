import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, map, takeUntil } from 'rxjs';
import { ProgramListComponent } from '../../components/program-list/program-list.component';
import { ProgramListEmbedConfig } from '../../interfaces/program-list.interface';
import { MetaService } from '../../services/meta.service';

const CATEGORY_ALIASES: Record<string, string[] | undefined> = {
  tdt: ['TDT'],
  autonomicos: ['AUTONOMICO'],
  autonomicas: ['AUTONOMICO'],
  tvpago: ['MOVISTAR', 'OTT', 'CABLE'],
  tematicos: ['MOVISTAR', 'OTT', 'CABLE'],
  todos: undefined,
};

@Component({
  selector: 'app-embed-program-guide',
  standalone: true,
  imports: [CommonModule, ProgramListComponent],
  templateUrl: './embed-program-guide.component.html',
  styleUrls: ['./embed-program-guide.component.scss'],
})
export class EmbedProgramGuideComponent implements OnInit, OnDestroy {
  public config: ProgramListEmbedConfig = {
    theme: 'light',
    date: 'today',
    channelLimit: 5,
    autorefreshSeconds: 300,
    language: 'es',
    showCategoryFilter: false,
  };

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly metaService: MetaService
  ) {}

  ngOnInit(): void {
    this.metaService.setMetaTags({
      title: 'Widget de programación embebido | Guía TV',
      description: 'Parrilla embebida de Guía TV para integraciones por iframe y oEmbed.',
      canonicalUrl: '/embed/programacion',
      robots: 'noindex, follow',
    });

    this.route.queryParamMap
      .pipe(
        map((params) => this.parseConfig(params)),
        takeUntil(this.destroy$)
      )
      .subscribe((config) => {
        this.config = config;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private parseConfig(params: any): ProgramListEmbedConfig {
    const theme = params.get('theme') === 'dark' ? 'dark' : 'light';
    const date = String(params.get('date') || 'today').trim() || 'today';
    const timeSlot = this.normalizeTimeSlot(params.get('timeSlot'));
    const channelLimit = this.clampNumber(params.get('channels'), 1, 20, 5);
    const channelIds = this.readCsv(params.get('channelIds'));
    const autorefreshSeconds = this.clampNumber(
      params.get('autorefresh'),
      60,
      3600,
      300
    );
    const explicitChannelTypes = this.readCsv(params.get('channelTypes')).map((value) =>
      value.toUpperCase()
    );
    const categoryAlias = String(params.get('category') || '')
      .trim()
      .toLowerCase();
    const channelTypes =
      explicitChannelTypes.length > 0
        ? explicitChannelTypes
        : CATEGORY_ALIASES[categoryAlias];

    return {
      theme,
      date,
      timeSlot,
      channelTypes,
      channelIds: channelIds.length > 0 ? channelIds : undefined,
      channelLimit,
      autorefreshSeconds,
      language: 'es',
      showCategoryFilter: false,
    };
  }

  private readCsv(rawValue: string | null): string[] {
    return String(rawValue || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  private clampNumber(
    rawValue: string | null,
    min: number,
    max: number,
    fallback: number
  ): number {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.max(min, Math.min(max, Math.round(parsed)));
  }

  private normalizeTimeSlot(rawValue: string | null): string | null {
    const parsed = Number(rawValue);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 7) {
      return null;
    }
    return String(parsed);
  }
}
