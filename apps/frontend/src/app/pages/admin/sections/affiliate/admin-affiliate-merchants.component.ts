import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AdminAffiliateMerchant,
  AdminAffiliateService,
  AdminMerchantCategory,
  AdminMerchantInput,
  AdminMerchantStatus,
} from '../../../../services/admin-affiliate.service';

type MerchantStatusFilter = 'all' | AdminMerchantStatus;

/**
 * Merchants tab — name/canonical key/aliases/category/logo/markets/URL/active
 * state, per the Phase 9 brief. `canonicalProviderKey` is the field an admin
 * edits; the internal `slug` (not shown here) is generated once on create and
 * never changes, so editing the canonical key or aliases later never orphans
 * the merchant's existing programs/offers.
 */
@Component({
  selector: 'app-admin-affiliate-merchants',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-affiliate-merchants.component.html',
})
export class AdminAffiliateMerchantsComponent implements OnInit {
  @Output() lastUpdatedChange = new EventEmitter<Date>();

  public readonly categoryOptions: Array<{ id: AdminMerchantCategory; label: string }> = [
    { id: 'streaming', label: 'Streaming' },
    { id: 'smart-tv', label: 'Smart TV' },
    { id: 'device', label: 'Dispositivos' },
    { id: 'ticketing', label: 'Entradas' },
    { id: 'event', label: 'Eventos' },
    { id: 'retail', label: 'Retail' },
    { id: 'vpn', label: 'VPN' },
    { id: 'other', label: 'Otro' },
  ];
  public readonly statusOptions: Array<{ id: MerchantStatusFilter; label: string }> = [
    { id: 'all', label: 'Todos' },
    { id: 'active', label: 'Activo' },
    { id: 'inactive', label: 'Inactivo' },
    { id: 'pending', label: 'Pendiente' },
  ];

  public merchants: AdminAffiliateMerchant[] = [];
  public loading = false;
  public error: string | null = null;
  public saving = false;
  public saveError: string | null = null;
  public saveSuccess: string | null = null;
  public selectedId: string | null = null;

  public statusFilter: MerchantStatusFilter = 'all';
  public searchTerm = '';

  public form: FormGroup;

  constructor(private readonly service: AdminAffiliateService, private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      canonicalProviderKey: ['', [Validators.required]],
      aliases: [''],
      category: ['streaming' as AdminMerchantCategory],
      logo: [''],
      officialUrl: ['', [Validators.required]],
      markets: ['ES'],
      status: ['active' as AdminMerchantStatus],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  get isEditing(): boolean {
    return Boolean(this.selectedId);
  }

  setStatusFilter(status: MerchantStatusFilter): void {
    this.statusFilter = status;
    this.load();
  }

  onSearchInput(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement | null)?.value || '';
  }

  applyFilters(): void {
    this.load();
  }

  refresh(): void {
    this.load();
  }

  submit(): void {
    if (this.saving) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.saveError = 'Completa nombre, clave canónica y URL oficial.';
      return;
    }

    const input = this.buildInput();
    this.saving = true;
    this.saveError = null;
    this.saveSuccess = null;

    const request$ = this.selectedId ? this.service.updateMerchant(this.selectedId, input) : this.service.createMerchant(input);
    request$.subscribe({
      next: () => {
        this.saving = false;
        this.saveSuccess = this.selectedId ? 'Merchant actualizado.' : 'Merchant creado.';
        this.resetForm();
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.saveError = this.extractError(err, 'No se pudo guardar el merchant.');
      },
    });
  }

  edit(merchant: AdminAffiliateMerchant): void {
    this.selectedId = merchant.id;
    this.saveError = null;
    this.saveSuccess = null;
    this.form.reset({
      name: merchant.name,
      canonicalProviderKey: merchant.canonicalProviderKey,
      aliases: merchant.aliases.join(', '),
      category: merchant.category,
      logo: merchant.logo || '',
      officialUrl: merchant.officialUrl,
      markets: merchant.markets.join(', '),
      status: merchant.status,
    });
  }

  resetForm(): void {
    this.selectedId = null;
    this.form.reset({
      name: '',
      canonicalProviderKey: '',
      aliases: '',
      category: 'streaming',
      logo: '',
      officialUrl: '',
      markets: 'ES',
      status: 'active',
    });
  }

  trackById(_index: number, merchant: AdminAffiliateMerchant): string {
    return merchant.id;
  }

  private buildInput(): AdminMerchantInput {
    return {
      name: this.trimmed('name'),
      canonicalProviderKey: this.trimmed('canonicalProviderKey'),
      aliases: this.parseList('aliases'),
      category: this.trimmed('category') as AdminMerchantCategory,
      logo: this.trimmed('logo') || undefined,
      officialUrl: this.trimmed('officialUrl'),
      markets: this.parseList('markets'),
      status: this.trimmed('status') as AdminMerchantStatus,
    };
  }

  private load(): void {
    this.loading = true;
    this.error = null;
    this.service
      .listMerchants({
        status: this.statusFilter !== 'all' ? this.statusFilter : undefined,
        search: this.searchTerm.trim() || undefined,
      })
      .subscribe({
        next: (merchants) => {
          this.merchants = merchants;
          this.loading = false;
          this.lastUpdatedChange.emit(new Date());
        },
        error: () => {
          this.loading = false;
          this.error = 'No se pudieron cargar los merchants.';
        },
      });
  }

  private parseList(controlName: string): string[] {
    const value = String(this.form.get(controlName)?.value || '');
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private trimmed(controlName: string): string {
    return String(this.form.get(controlName)?.value || '').trim();
  }

  private extractError(err: unknown, fallback: string): string {
    const message = (err as { error?: { error?: { message?: string } } })?.error?.error?.message;
    return message || fallback;
  }
}
