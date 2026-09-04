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
import { AffiliateService } from '../../services/affiliate.service';
import {
  AffiliateContext,
  AffiliatePlacementKey,
  AffiliateResolvedOffer,
} from '../../interfaces/affiliate.interface';
import { AffiliateDisclosureComponent } from '../affiliate-disclosure/affiliate-disclosure.component';
import { AffiliateImpressionDirective } from '../../directives/affiliate-impression.directive';

@Component({
  selector: 'app-where-to-watch',
  standalone: true,
  imports: [CommonModule, AffiliateDisclosureComponent, AffiliateImpressionDirective],
  template: `
    <section *ngIf="providers || isLoading" class="space-y-4">
      <div *ngIf="isLoading" class="flex gap-2">
        <div *ngFor="let item of [1, 2, 3]" class="w-24 h-10 rounded-xl skeleton"></div>
      </div>

      <ng-container *ngIf="!isLoading && providers as data">
        <div *ngIf="data.flatrate?.length">
          <p class="mb-2 text-[10px] uppercase tracking-widest text-[var(--portal-text-muted)]">
            Incluido en suscripcion
          </p>
          <div class="flex flex-wrap gap-2">
            <a
              *ngFor="let provider of data.flatrate"
              [href]="resolveHref(provider, data.tmdbLink)"
              target="_blank"
              [attr.rel]="resolveRel(provider)"
              [appAffiliateImpression]="affiliateOfferFor(provider) || null"
              [appAffiliateImpressionContext]="impressionContext()"
              [appAffiliateImpressionPage]="page"
              class="flex items-center gap-2 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-strong)] px-3 py-2 no-underline transition-all hover:border-[var(--portal-border-strong)] active:scale-95"
            >
              <img
                [src]="resolveLogo(provider)"
                [alt]="provider.name"
                class="h-6 w-6 rounded object-contain"
                loading="lazy"
              />
              <span class="text-xs font-medium text-[var(--portal-text)]">{{ provider.name }}</span>
              <span
                *ngIf="affiliateOfferFor(provider)?.cta?.sponsored"
                class="text-[9px] uppercase tracking-wide text-[var(--portal-text-muted)]"
              >Patrocinado</span>
            </a>
          </div>
        </div>

        <div *ngIf="data.free?.length">
          <p class="mb-2 text-[10px] uppercase tracking-widest text-[var(--portal-text-muted)]">Gratis</p>
          <div class="flex flex-wrap gap-2">
            <a
              *ngFor="let provider of data.free"
              [href]="resolveHref(provider, data.tmdbLink)"
              target="_blank"
              [attr.rel]="resolveRel(provider)"
              [appAffiliateImpression]="affiliateOfferFor(provider) || null"
              [appAffiliateImpressionContext]="impressionContext()"
              [appAffiliateImpressionPage]="page"
              class="flex items-center gap-2 rounded-xl border border-[var(--accent-discover)]/40 bg-[var(--accent-discover)]/10 px-3 py-2 no-underline transition-all active:scale-95"
            >
              <img
                [src]="resolveLogo(provider)"
                [alt]="provider.name"
                class="h-6 w-6 rounded object-contain"
                loading="lazy"
              />
              <span class="text-xs font-medium text-[var(--portal-text)]">{{ provider.name }}</span>
            </a>
          </div>
        </div>

        <div *ngIf="data.rent?.length || data.buy?.length">
          <p class="mb-2 text-[10px] uppercase tracking-widest text-[var(--portal-text-muted)]">
            Alquilar / Comprar
          </p>
          <div class="flex flex-wrap gap-2">
            <a
              *ngFor="let provider of paidProviders(data)"
              [href]="resolveHref(provider, data.tmdbLink)"
              target="_blank"
              [attr.rel]="resolveRel(provider)"
              [appAffiliateImpression]="affiliateOfferFor(provider) || null"
              [appAffiliateImpressionContext]="impressionContext()"
              [appAffiliateImpressionPage]="page"
              class="flex items-center gap-2 rounded-xl border border-[var(--spotify-warning)]/40 bg-[var(--spotify-warning)]/10 px-3 py-2 no-underline transition-all active:scale-95"
            >
              <img
                [src]="resolveLogo(provider)"
                [alt]="provider.name"
                class="h-6 w-6 rounded object-contain"
                loading="lazy"
              />
              <span class="text-xs font-medium text-[var(--portal-text)]">{{ provider.name }}</span>
              <span *ngIf="provider.price" class="text-[10px] text-[var(--portal-text-muted)]">
                {{ provider.price }}
              </span>
              <span
                *ngIf="affiliateOfferFor(provider)?.cta?.sponsored"
                class="text-[9px] uppercase tracking-wide text-[var(--portal-text-muted)]"
              >Patrocinado</span>
            </a>
          </div>
        </div>

        <div *ngIf="!hasAnyProvider(data)" class="text-xs italic text-[var(--portal-text-muted)]">
          No disponible en plataformas de streaming en Espana actualmente
        </div>

        <app-affiliate-disclosure [sponsored]="showSponsoredDisclosure" [compact]="true"></app-affiliate-disclosure>

        <a
          *ngIf="data.tmdbLink"
          [href]="data.tmdbLink"
          target="_blank"
          rel="noopener"
          class="block text-[10px] text-[var(--portal-text-muted)] hover:text-[var(--portal-text-soft)]"
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
  @Input() providersData?: ContentProvidersDTO | null;
  @Input() primaryPlatforms: string[] = [];
  /** Affiliate placement key for this instance (catalog-detail, epg-program-detail, ...). WhereToWatch stays the availability authority; this only changes outbound treatment. */
  @Input() placement: AffiliatePlacementKey = 'where-to-watch';
  @Input() market = 'ES';
  /** Content id used for affiliate context; falls back to `contentId` when absent. */
  @Input() catalogId?: string | null;
  /** Free-text provider/channel reference forwarded as an affiliate context hint (e.g. the airing channel's name). */
  @Input() providerHint?: string | null;
  /** Current page path, forwarded verbatim into impression payloads. */
  @Input() page?: string;

  public providers: ContentProvidersDTO | null = null;
  public isLoading = false;
  /** Merchant name/slug (normalized) -> resolved affiliate offer, for the currently loaded provider list. */
  public affiliateOffers = new Map<string, AffiliateResolvedOffer>();
  public showSponsoredDisclosure = false;

  private readonly providersService = inject(StreamingProvidersService);
  private readonly affiliateService = inject(AffiliateService);

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['providersData'] ||
      changes['primaryPlatforms'] ||
      changes['contentId'] ||
      changes['tmdbId'] ||
      changes['contentType'] ||
      changes['catalogId'] ||
      changes['placement'] ||
      changes['providerHint']
    ) {
      this.loadProviders();
    }
  }

  paidProviders(data: ContentProvidersDTO): ProviderChipDTO[] {
    const unique = new Map<string, ProviderChipDTO>();
    [...(data.rent || []), ...(data.buy || [])].forEach((provider) => {
      const key = provider.name.trim().toLocaleLowerCase('es');
      if (!unique.has(key)) {
        unique.set(key, provider);
      }
    });
    return Array.from(unique.values());
  }

  hasAnyProvider(data: ContentProvidersDTO): boolean {
    return Boolean(
      data.flatrate?.length || data.free?.length || data.rent?.length || data.buy?.length
    );
  }

  resolveLogo(provider: ProviderChipDTO): string {
    return provider.logoUrl || this.providersService.getLocalLogoPath(provider.name);
  }

  /** The verified affiliate offer for this provider chip, if the resolver matched one — never a guess by name alone. */
  affiliateOfferFor(provider: ProviderChipDTO): AffiliateResolvedOffer | undefined {
    return this.affiliateOffers.get(normalizeProviderKey(provider.name));
  }

  /** Affiliate outbound path when a verified offer exists; otherwise the original availability link, unchanged. */
  resolveHref(provider: ProviderChipDTO, tmdbLink?: string): string {
    const offer = this.affiliateOfferFor(provider);
    if (offer) {
      return this.affiliateService.buildOutboundUrl(offer);
    }
    return provider.deepLink || tmdbLink || '#';
  }

  resolveRel(provider: ProviderChipDTO): string {
    const offer = this.affiliateOfferFor(provider);
    if (!offer) return 'noopener';
    return offer.cta.sponsored ? 'sponsored noopener noreferrer' : 'noopener noreferrer';
  }

  impressionContext(): Pick<AffiliateContext, 'market' | 'placement' | 'contentType' | 'contentId'> {
    return {
      market: this.market,
      placement: this.placement,
      contentType: this.contentType || undefined,
      contentId: this.catalogId || this.contentId || undefined,
    };
  }

  private loadProviders(): void {
    if (this.providersData && this.hasAnyProvider(this.providersData)) {
      this.providers = this.providersData;
      this.isLoading = false;
      this.resolveAffiliateOffers();
      return;
    }

    if (!this.contentId && !this.tmdbId) {
      this.providers = this.fallbackProviders();
      this.isLoading = false;
      this.resolveAffiliateOffers();
      return;
    }

    this.isLoading = true;
    const request$ =
      this.tmdbId && this.contentType
        ? this.providersService.getProvidersByTmdb(this.tmdbId, this.contentType)
        : this.providersService.getProviders(String(this.contentId || ''));

    request$.subscribe((providers) => {
      this.providers = this.hasAnyProvider(providers) ? providers : this.fallbackProviders();
      this.isLoading = false;
      this.resolveAffiliateOffers();
    });
  }

  /**
   * Batches one resolve call across every provider name shown, rather than
   * one call per chip — the Affiliate Engine's `providerKeys` resolver
   * endpoint exists exactly for this. Never blocks the (already-rendered)
   * provider list: offers stream in and progressively upgrade chip hrefs.
   */
  private resolveAffiliateOffers(): void {
    this.affiliateOffers = new Map();
    this.showSponsoredDisclosure = false;

    const data = this.providers;
    if (!data) return;

    const names = this.collectProviderNames(data);
    if (!names.length) return;

    const context: AffiliateContext = {
      market: this.market,
      placement: this.placement,
      contentType: this.contentType || undefined,
      contentId: this.catalogId || this.contentId || undefined,
      providerKey: this.providerHint || undefined,
    };

    this.affiliateService
      .resolveMany(context, { providerKeys: names, maxResults: names.length })
      .subscribe((offers) => {
        const map = new Map<string, AffiliateResolvedOffer>();
        offers.forEach((offer) => {
          map.set(normalizeProviderKey(offer.merchant.name), offer);
          map.set(normalizeProviderKey(offer.merchant.slug), offer);
        });
        this.affiliateOffers = map;
        this.showSponsoredDisclosure = offers.some((offer) => offer.cta.sponsored);
      });
  }

  private collectProviderNames(data: ContentProvidersDTO): string[] {
    const names = new Set<string>();
    [...(data.flatrate || []), ...(data.free || []), ...(data.rent || []), ...(data.buy || [])].forEach(
      (provider) => {
        if (provider.name) names.add(provider.name);
      }
    );
    return Array.from(names);
  }

  private fallbackProviders(): ContentProvidersDTO | null {
    const names = Array.from(new Set((this.primaryPlatforms || []).map((name) => name.trim()).filter(Boolean)));
    if (!names.length) {
      return this.providersData || null;
    }
    return {
      flatrate: names.map((name, index) => ({
        id: -(index + 1),
        name,
        type: 'flatrate' as const,
      })),
    };
  }
}

/** Diacritic/case-insensitive key so "Movistar+" and "movistar plus" can match the same merchant. */
function normalizeProviderKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
