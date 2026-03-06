import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import {
  ContentProvidersDTO,
  ProviderChipDTO,
  StreamingProvidersService,
} from '../../services/streaming-providers.service';

@Component({
  selector: 'app-where-to-watch',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section *ngIf="providers || isLoading" class="space-y-4">
      <div *ngIf="isLoading" class="flex gap-2">
        <div *ngFor="let item of [1, 2, 3]" class="w-24 h-10 rounded-xl skeleton"></div>
      </div>

      <ng-container *ngIf="!isLoading && providers as data">
        <div *ngIf="data.flatrate?.length">
          <p class="mb-2 text-[10px] uppercase tracking-widest text-slate-500">
            Incluido en suscripcion
          </p>
          <div class="flex flex-wrap gap-2">
            <a
              *ngFor="let provider of data.flatrate"
              [href]="provider.deepLink || data.tmdbLink"
              target="_blank"
              rel="noopener"
              class="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/80 px-3 py-2 no-underline transition-all hover:border-slate-500 active:scale-95"
            >
              <img
                [src]="resolveLogo(provider)"
                [alt]="provider.name"
                class="h-6 w-6 rounded object-contain"
                loading="lazy"
              />
              <span class="text-xs font-medium text-white">{{ provider.name }}</span>
            </a>
          </div>
        </div>

        <div *ngIf="data.free?.length">
          <p class="mb-2 text-[10px] uppercase tracking-widest text-slate-500">Gratis</p>
          <div class="flex flex-wrap gap-2">
            <a
              *ngFor="let provider of data.free"
              [href]="provider.deepLink || data.tmdbLink"
              target="_blank"
              rel="noopener"
              class="flex items-center gap-2 rounded-xl border border-emerald-700/40 bg-emerald-900/20 px-3 py-2 no-underline transition-all active:scale-95"
            >
              <img
                [src]="resolveLogo(provider)"
                [alt]="provider.name"
                class="h-6 w-6 rounded object-contain"
                loading="lazy"
              />
              <span class="text-xs font-medium text-white">{{ provider.name }}</span>
            </a>
          </div>
        </div>

        <div *ngIf="data.rent?.length || data.buy?.length">
          <p class="mb-2 text-[10px] uppercase tracking-widest text-slate-500">
            Alquilar / Comprar
          </p>
          <div class="flex flex-wrap gap-2">
            <a
              *ngFor="let provider of paidProviders(data)"
              [href]="provider.deepLink || data.tmdbLink"
              target="_blank"
              rel="noopener"
              class="flex items-center gap-2 rounded-xl border border-amber-700/40 bg-amber-900/20 px-3 py-2 no-underline transition-all active:scale-95"
            >
              <img
                [src]="resolveLogo(provider)"
                [alt]="provider.name"
                class="h-6 w-6 rounded object-contain"
                loading="lazy"
              />
              <span class="text-xs font-medium text-white">{{ provider.name }}</span>
              <span *ngIf="provider.price" class="text-[10px] text-slate-400">
                {{ provider.price }}
              </span>
            </a>
          </div>
        </div>

        <div *ngIf="!hasAnyProvider(data)" class="text-xs italic text-slate-500">
          No disponible en plataformas de streaming en Espana actualmente
        </div>

        <a
          *ngIf="data.tmdbLink"
          [href]="data.tmdbLink"
          target="_blank"
          rel="noopener"
          class="block text-[10px] text-slate-500 hover:text-slate-300"
        >
          Ver todas las opciones en JustWatch ->
        </a>
      </ng-container>
    </section>
  `,
})
export class WhereToWatchComponent implements OnChanges {
  @Input() contentId?: string | null;
  @Input() tmdbId?: number | null;
  @Input() contentType?: 'movie' | 'tv' | null;

  public providers: ContentProvidersDTO | null = null;
  public isLoading = false;

  private readonly providersService = inject(StreamingProvidersService);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contentId'] || changes['tmdbId'] || changes['contentType']) {
      this.loadProviders();
    }
  }

  paidProviders(data: ContentProvidersDTO): ProviderChipDTO[] {
    return [...(data.rent || []), ...(data.buy || [])];
  }

  hasAnyProvider(data: ContentProvidersDTO): boolean {
    return Boolean(
      data.flatrate?.length || data.free?.length || data.rent?.length || data.buy?.length
    );
  }

  resolveLogo(provider: ProviderChipDTO): string {
    return provider.logoUrl || this.providersService.getLocalLogoPath(provider.name);
  }

  private loadProviders(): void {
    if (!this.contentId && !this.tmdbId) {
      this.providers = null;
      return;
    }

    this.isLoading = true;
    const request$ =
      this.tmdbId && this.contentType
        ? this.providersService.getProvidersByTmdb(this.tmdbId, this.contentType)
        : this.providersService.getProviders(String(this.contentId || ''));

    request$.subscribe((providers) => {
      this.providers = providers;
      this.isLoading = false;
    });
  }
}
