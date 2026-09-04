import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AdminAffiliateMerchant,
  AdminAffiliateOffer,
  AdminAffiliateProgram,
  AdminAffiliateService,
  AdminDeepLinkStrategy,
  AdminOfferCategory,
  AdminOfferInput,
  AdminOfferStatus,
  AdminOfferVerificationStatus,
} from '../../../../services/admin-affiliate.service';

type OfferStatusFilter = 'all' | AdminOfferStatus;

/**
 * Offers tab — enable/disable, pricing, plan, validity, features,
 * recommendation intents, destination and placements, per the Phase 9 brief.
 * The list never silently shows a stale price as current: every row surfaces
 * `expired` (validity window has lapsed, even if `status` still says active)
 * and `verificationDisplay` (current/stale/needs_review) from the backend.
 */
@Component({
  selector: 'app-admin-affiliate-offers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-affiliate-offers.component.html',
})
export class AdminAffiliateOffersComponent implements OnInit {
  @Output() lastUpdatedChange = new EventEmitter<Date>();

  public readonly categoryOptions: Array<{ id: AdminOfferCategory; label: string }> = [
    { id: 'streaming', label: 'Streaming' },
    { id: 'smart-tv', label: 'Smart TV' },
    { id: 'device', label: 'Dispositivos' },
    { id: 'ticketing', label: 'Entradas' },
    { id: 'event', label: 'Eventos' },
    { id: 'retail', label: 'Retail' },
    { id: 'vpn', label: 'VPN' },
  ];
  public readonly strategyOptions: Array<{ id: AdminDeepLinkStrategy; label: string }> = [
    { id: 'direct_url', label: 'URL directa' },
    { id: 'url_template', label: 'Plantilla de URL' },
    { id: 'network_redirect', label: 'Redirección de red' },
    { id: 'tag_param', label: 'Parámetro de tag' },
    { id: 'api_generated', label: 'Generado por API' },
  ];
  public readonly verificationStatusOptions: Array<{ id: AdminOfferVerificationStatus; label: string }> = [
    { id: 'current', label: 'Vigente' },
    { id: 'stale', label: 'Desactualizado' },
    { id: 'needs_review', label: 'Requiere revisión' },
  ];
  public readonly statusFilterOptions: Array<{ id: OfferStatusFilter; label: string }> = [
    { id: 'all', label: 'Todos' },
    { id: 'active', label: 'Activa' },
    { id: 'inactive', label: 'Inactiva' },
    { id: 'draft', label: 'Borrador' },
    { id: 'expired', label: 'Expirada' },
  ];

  public merchants: AdminAffiliateMerchant[] = [];
  public programs: AdminAffiliateProgram[] = [];
  public offers: AdminAffiliateOffer[] = [];
  public total = 0;
  public loading = false;
  public error: string | null = null;
  public saving = false;
  public saveError: string | null = null;
  public saveSuccess: string | null = null;
  public deactivatingId: string | null = null;
  public selectedId: string | null = null;
  public statusFilter: OfferStatusFilter = 'all';
  public form: FormGroup;

  constructor(private readonly service: AdminAffiliateService, private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      merchantId: ['', [Validators.required]],
      affiliateProgramId: ['', [Validators.required]],
      market: ['ES', [Validators.required]],
      category: ['streaming' as AdminOfferCategory],
      planId: ['', [Validators.required]],
      planName: ['', [Validators.required]],
      currency: ['EUR'],
      monthlyAmount: [null],
      annualAmount: [null],
      monthlyLabel: [''],
      annualLabel: [''],
      recommendationIntents: [''],
      placements: [''],
      strategy: ['direct_url' as AdminDeepLinkStrategy],
      destinationUrl: ['', [Validators.required]],
      validFrom: [''],
      validUntil: [''],
      status: ['draft' as AdminOfferStatus],
      verificationSource: [''],
      verifiedAt: [''],
      verificationStatus: ['needs_review' as AdminOfferVerificationStatus],
      bestFor: [''],
      highlight: [''],
      disclosure: ['Este enlace es de afiliado.', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.service.listMerchants().subscribe({ next: (merchants) => (this.merchants = merchants) });
    this.service.listPrograms().subscribe({ next: (programs) => (this.programs = programs) });
    this.load();
  }

  get isEditing(): boolean {
    return Boolean(this.selectedId);
  }

  merchantName(id: string): string {
    return this.merchants.find((m) => m.id === id)?.name || id;
  }

  setStatusFilter(status: OfferStatusFilter): void {
    this.statusFilter = status;
    this.load();
  }

  refresh(): void {
    this.load();
  }

  submit(): void {
    if (this.saving) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.saveError = 'Completa merchant, programa, plan, destino y disclosure.';
      return;
    }

    const input = this.buildInput();
    this.saving = true;
    this.saveError = null;
    this.saveSuccess = null;

    const request$ = this.selectedId ? this.service.updateOffer(this.selectedId, input) : this.service.createOffer(input);
    request$.subscribe({
      next: () => {
        this.saving = false;
        this.saveSuccess = this.selectedId ? 'Oferta actualizada.' : 'Oferta creada.';
        this.resetForm();
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.saveError = this.extractError(err, 'No se pudo guardar la oferta.');
      },
    });
  }

  edit(offer: AdminAffiliateOffer): void {
    this.selectedId = offer.id;
    this.saveError = null;
    this.saveSuccess = null;
    this.form.reset({
      merchantId: offer.merchantId,
      affiliateProgramId: offer.affiliateProgramId,
      market: offer.market,
      category: offer.category,
      planId: offer.plan.id,
      planName: offer.plan.name,
      currency: offer.pricing.currency,
      monthlyAmount: offer.pricing.monthlyAmount,
      annualAmount: offer.pricing.annualAmount,
      monthlyLabel: offer.pricing.monthlyLabel,
      annualLabel: offer.pricing.annualLabel,
      recommendationIntents: offer.recommendationIntents.join(', '),
      placements: (offer.placements || []).join(', '),
      strategy: offer.destination.strategy,
      destinationUrl: offer.destination.url,
      validFrom: this.toDateInput(offer.validity.validFrom),
      validUntil: this.toDateInput(offer.validity.validUntil),
      status: offer.status,
      verificationSource: offer.verification.source || '',
      verifiedAt: this.toDateInput(offer.verification.verifiedAt),
      verificationStatus: offer.verification.status,
      bestFor: offer.display.bestFor || '',
      highlight: offer.display.highlight || '',
      disclosure: offer.display.disclosure,
    });
  }

  deactivate(offer: AdminAffiliateOffer): void {
    if (this.deactivatingId) return;
    this.deactivatingId = offer.id;
    this.service.deactivateOffer(offer.id).subscribe({
      next: () => {
        this.deactivatingId = null;
        this.saveSuccess = 'Oferta desactivada.';
        this.load();
      },
      error: () => {
        this.deactivatingId = null;
        this.saveError = 'No se pudo desactivar la oferta.';
      },
    });
  }

  resetForm(): void {
    this.selectedId = null;
    this.form.reset({
      merchantId: '',
      affiliateProgramId: '',
      market: 'ES',
      category: 'streaming',
      planId: '',
      planName: '',
      currency: 'EUR',
      monthlyAmount: null,
      annualAmount: null,
      monthlyLabel: '',
      annualLabel: '',
      recommendationIntents: '',
      placements: '',
      strategy: 'direct_url',
      destinationUrl: '',
      validFrom: '',
      validUntil: '',
      status: 'draft',
      verificationSource: '',
      verifiedAt: '',
      verificationStatus: 'needs_review',
      bestFor: '',
      highlight: '',
      disclosure: 'Este enlace es de afiliado.',
    });
  }

  trackById(_index: number, offer: AdminAffiliateOffer): string {
    return offer.id;
  }

  verificationBadgeClass(status: AdminAffiliateOffer['verificationDisplay']): string {
    if (status === 'current') return 'bg-[var(--accent-discover)]/20 text-[var(--accent-discover)] border-[var(--accent-discover)]/40';
    if (status === 'stale') return 'bg-[var(--spotify-warning)]/20 text-[var(--spotify-warning)] border-[var(--spotify-warning)]/40';
    return 'bg-[var(--spotify-negative)]/20 text-[var(--spotify-negative)] border-[var(--spotify-negative)]/40';
  }

  private buildInput(): AdminOfferInput {
    return {
      merchantId: this.form.get('merchantId')?.value,
      affiliateProgramId: this.form.get('affiliateProgramId')?.value,
      market: String(this.form.get('market')?.value || '').trim(),
      category: this.form.get('category')?.value,
      plan: { id: String(this.form.get('planId')?.value || '').trim(), name: String(this.form.get('planName')?.value || '').trim() },
      pricing: {
        currency: String(this.form.get('currency')?.value || 'EUR').trim(),
        monthlyAmount: this.numberOrNull(this.form.get('monthlyAmount')?.value),
        annualAmount: this.numberOrNull(this.form.get('annualAmount')?.value),
        monthlyLabel: String(this.form.get('monthlyLabel')?.value || ''),
        annualLabel: String(this.form.get('annualLabel')?.value || ''),
        activationFeeAmount: null,
      },
      features: {},
      requirements: { commitmentMonths: 0, fibreRequired: false, mobileRequired: false, device: null },
      trial: { days: null },
      recommendationIntents: this.parseList('recommendationIntents'),
      placements: this.parseList('placements'),
      destination: { strategy: this.form.get('strategy')?.value, url: String(this.form.get('destinationUrl')?.value || '').trim() },
      validity: {
        validFrom: this.form.get('validFrom')?.value || undefined,
        validUntil: this.form.get('validUntil')?.value || undefined,
      },
      status: this.form.get('status')?.value,
      verification: {
        source: String(this.form.get('verificationSource')?.value || '').trim() || undefined,
        verifiedAt: this.form.get('verifiedAt')?.value || undefined,
        status: this.form.get('verificationStatus')?.value,
      },
      display: {
        bestFor: String(this.form.get('bestFor')?.value || '').trim() || undefined,
        highlight: String(this.form.get('highlight')?.value || '').trim() || undefined,
        disclosure: String(this.form.get('disclosure')?.value || '').trim(),
      },
    };
  }

  private load(): void {
    this.loading = true;
    this.error = null;
    this.service.listOffers({ status: this.statusFilter !== 'all' ? this.statusFilter : undefined }).subscribe({
      next: ({ offers, total }) => {
        this.offers = offers;
        this.total = total;
        this.loading = false;
        this.lastUpdatedChange.emit(new Date());
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudieron cargar las ofertas.';
      },
    });
  }

  private parseList(controlName: string): string[] {
    return String(this.form.get(controlName)?.value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private numberOrNull(value: unknown): number | null {
    const n = Number(value);
    return Number.isFinite(n) && value !== '' && value !== null ? n : null;
  }

  private toDateInput(value?: string): string {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  }

  private extractError(err: unknown, fallback: string): string {
    const message = (err as { error?: { error?: { message?: string } } })?.error?.error?.message;
    return message || fallback;
  }
}
