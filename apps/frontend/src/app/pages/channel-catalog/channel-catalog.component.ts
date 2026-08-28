import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import {
  TvReadChannelSummaryDTO,
  TvReadChannelsResponseDTO,
} from '../../api/models';
import { TvApiService } from '../../api/tv-api.service';
import { ChannelCardComponent } from '../../components/channel-card/channel-card.component';
import { UnifiedAsyncStateComponent } from '../../components/unified-async-state/unified-async-state.component';

type DirectoryState =
  | { status: 'loading'; data: null }
  | { status: 'ready'; data: TvReadChannelsResponseDTO }
  | { status: 'error'; data: null };

export type ChannelAccessFilter = 'all' | 'free' | 'pay';

@Component({
  selector: 'app-channel-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ChannelCardComponent, UnifiedAsyncStateComponent],
  templateUrl: './channel-catalog.component.html',
  styleUrl: './channel-catalog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelCatalogComponent {
  private readonly api = inject(TvApiService);
  readonly groups = [
    { id: 'all', label: 'Todos' },
    { id: 'tdt', label: 'TDT' },
    { id: 'cable', label: 'Cable' },
    { id: 'movistar', label: 'Movistar+' },
    { id: 'online', label: 'Online' },
    { id: 'deporte', label: 'Deportes' },
    { id: 'autonomico', label: 'Autonómicos' },
  ] as const;
  readonly query = signal('');
  readonly selectedGroup = signal('all');
  readonly selectedAccess = signal<ChannelAccessFilter>('all');
  private readonly refreshVersion = signal(0);
  private readonly request = computed(() => ({
    group: this.selectedGroup(),
    refresh: this.refreshVersion(),
  }));
  private readonly state = toSignal(
    toObservable(this.request).pipe(
      switchMap(({ group }) =>
        this.api.getTvReadChannels('today', group === 'all' ? undefined : group).pipe(
          map((response): DirectoryState => response.data
            ? { status: 'ready', data: response.data }
            : { status: 'error', data: null }),
          catchError(() => of<DirectoryState>({ status: 'error', data: null })),
          startWith<DirectoryState>({ status: 'loading', data: null })
        )
      )
    ),
    { initialValue: { status: 'loading', data: null } as DirectoryState }
  );

  readonly status = computed(() => this.state().status);
  readonly channels = computed(() => filterChannelDirectory(
    this.state().data?.channels || [],
    this.query(),
    this.selectedAccess()
  ));
  readonly resultLabel = computed(() => {
    const count = this.channels().length;
    return `${count} ${count === 1 ? 'canal' : 'canales'}`;
  });

  selectGroup(group: string): void {
    this.selectedGroup.set(group);
  }

  selectAccess(access: ChannelAccessFilter): void {
    this.selectedAccess.set(access);
  }

  retry(): void {
    this.refreshVersion.update((value) => value + 1);
  }

  clearFilters(): void {
    this.query.set('');
    this.selectedGroup.set('all');
    this.selectedAccess.set('all');
  }

  trackByChannel(_index: number, entry: TvReadChannelSummaryDTO): string {
    return entry.channel.id;
  }
}

export function filterChannelDirectory(
  entries: TvReadChannelSummaryDTO[],
  query: string,
  access: ChannelAccessFilter
): TvReadChannelSummaryDTO[] {
  const normalizedQuery = normalizeSearch(query);
  return entries.filter((entry) => {
    const channel = entry.channel;
    if (access !== 'all' && channel.access !== access) return false;
    if (!normalizedQuery) return true;
    const haystack = [
      channel.name,
      channel.operator,
      ...(channel.providers || []),
      ...(channel.aliases || []),
    ].map(normalizeSearch).join(' ');
    return haystack.includes(normalizedQuery);
  });
}

function normalizeSearch(value?: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}
