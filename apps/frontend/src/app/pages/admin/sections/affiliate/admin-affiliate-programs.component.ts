import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AdminAffiliateMerchant,
  AdminAffiliateNetwork,
  AdminAffiliateProgram,
  AdminAffiliateService,
  AdminCommercialRelationship,
  AdminProgramInput,
  AdminProgramStatus,
  AdminProgramVerificationStatus,
} from '../../../../services/admin-affiliate.service';

/**
 * Programs tab. Secret credentials are never handled here: `secretRef` is
 * only the *name* of an env var / secret-manager key (never persisted or
 * displayed as a value anywhere in this app) and the list/detail view shows
 * only the backend-derived `secretStatus` badge — "Configured ✓" or
 * "Missing" — never the value behind it.
 */
@Component({
  selector: 'app-admin-affiliate-programs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-affiliate-programs.component.html',
})
export class AdminAffiliateProgramsComponent implements OnInit {
  @Output() lastUpdatedChange = new EventEmitter<Date>();

  public readonly relationshipOptions: Array<{ id: AdminCommercialRelationship; label: string }> = [
    { id: 'affiliate_configured', label: 'Afiliado configurado' },
    { id: 'direct_commercial_link', label: 'Enlace comercial directo' },
    { id: 'manual_agreement_required', label: 'Acuerdo manual requerido' },
    { id: 'no_affiliate_available', label: 'Sin afiliación disponible' },
    { id: 'unknown', label: 'Desconocido' },
  ];
  public readonly verificationStatusOptions: Array<{ id: AdminProgramVerificationStatus; label: string }> = [
    { id: 'approved', label: 'Aprobado' },
    { id: 'pending', label: 'Pendiente' },
    { id: 'needs_review', label: 'Requiere revisión' },
  ];

  public merchants: AdminAffiliateMerchant[] = [];
  public networks: AdminAffiliateNetwork[] = [];
  public programs: AdminAffiliateProgram[] = [];
  public loading = false;
  public error: string | null = null;
  public saving = false;
  public saveError: string | null = null;
  public saveSuccess: string | null = null;
  public selectedId: string | null = null;
  public form: FormGroup;

  constructor(private readonly service: AdminAffiliateService, private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      merchantId: ['', [Validators.required]],
      networkId: ['', [Validators.required]],
      market: ['ES', [Validators.required]],
      externalProgramId: [''],
      relationship: ['affiliate_configured' as AdminCommercialRelationship],
      status: ['active' as AdminProgramStatus],
      allowedHosts: ['', [Validators.required]],
      disclosure: ['Este enlace es de afiliado.', [Validators.required]],
      cookieDays: [30],
      clickIdParam: [''],
      secretRef: [''],
      verificationSource: [''],
      verifiedAt: [''],
      verificationStatus: ['pending' as AdminProgramVerificationStatus],
    });
  }

  ngOnInit(): void {
    this.service.listMerchants().subscribe({ next: (merchants) => (this.merchants = merchants) });
    this.service.listNetworks().subscribe({ next: (networks) => (this.networks = networks) });
    this.load();
  }

  get isEditing(): boolean {
    return Boolean(this.selectedId);
  }

  merchantName(id: string): string {
    return this.merchants.find((m) => m.id === id)?.name || id;
  }

  networkName(id: string): string {
    return this.networks.find((n) => n.id === id)?.name || id;
  }

  refresh(): void {
    this.load();
  }

  submit(): void {
    if (this.saving) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.saveError = 'Completa merchant, red, mercado, hosts permitidos y disclosure.';
      return;
    }

    const input = this.buildInput();
    this.saving = true;
    this.saveError = null;
    this.saveSuccess = null;

    const request$ = this.selectedId ? this.service.updateProgram(this.selectedId, input) : this.service.createProgram(input);
    request$.subscribe({
      next: () => {
        this.saving = false;
        this.saveSuccess = this.selectedId ? 'Programa actualizado.' : 'Programa creado.';
        this.resetForm();
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.saveError = this.extractError(err, 'No se pudo guardar el programa. Revisa los hosts permitidos.');
      },
    });
  }

  edit(program: AdminAffiliateProgram): void {
    this.selectedId = program.id;
    this.saveError = null;
    this.saveSuccess = null;
    this.form.reset({
      merchantId: program.merchantId,
      networkId: program.networkId,
      market: program.market,
      externalProgramId: program.externalProgramId || '',
      relationship: program.relationship,
      status: program.status,
      allowedHosts: program.allowedHosts.join(', '),
      disclosure: program.disclosure,
      cookieDays: program.attribution?.cookieDays ?? 30,
      clickIdParam: program.attribution?.clickIdParam || '',
      secretRef: program.secretRefName || '',
      verificationSource: program.verification.source || '',
      verifiedAt: this.toDateInput(program.verification.verifiedAt),
      verificationStatus: program.verification.status,
    });
  }

  resetForm(): void {
    this.selectedId = null;
    this.form.reset({
      merchantId: '',
      networkId: '',
      market: 'ES',
      externalProgramId: '',
      relationship: 'affiliate_configured',
      status: 'active',
      allowedHosts: '',
      disclosure: 'Este enlace es de afiliado.',
      cookieDays: 30,
      clickIdParam: '',
      secretRef: '',
      verificationSource: '',
      verifiedAt: '',
      verificationStatus: 'pending',
    });
  }

  trackById(_index: number, program: AdminAffiliateProgram): string {
    return program.id;
  }

  secretBadgeClass(status: AdminAffiliateProgram['secretStatus']): string {
    if (status === 'configured') return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40';
    if (status === 'missing') return 'bg-red-500/20 text-red-200 border-red-500/40';
    return 'bg-[var(--portal-surface)] text-[var(--portal-text-muted)] border-[var(--portal-border-strong)]';
  }

  secretBadgeLabel(status: AdminAffiliateProgram['secretStatus']): string {
    if (status === 'configured') return 'Configurado ✓';
    if (status === 'missing') return 'Falta';
    return 'No aplica';
  }

  private buildInput(): AdminProgramInput {
    const cookieDays = Number(this.form.get('cookieDays')?.value);
    const clickIdParam = String(this.form.get('clickIdParam')?.value || '').trim();
    const secretRef = String(this.form.get('secretRef')?.value || '').trim();
    return {
      merchantId: this.form.get('merchantId')?.value,
      networkId: this.form.get('networkId')?.value,
      market: String(this.form.get('market')?.value || '').trim(),
      externalProgramId: String(this.form.get('externalProgramId')?.value || '').trim() || undefined,
      relationship: this.form.get('relationship')?.value,
      status: this.form.get('status')?.value,
      allowedHosts: String(this.form.get('allowedHosts')?.value || '')
        .split(',')
        .map((h) => h.trim())
        .filter(Boolean),
      disclosure: String(this.form.get('disclosure')?.value || '').trim(),
      attribution:
        Number.isFinite(cookieDays) || clickIdParam || secretRef
          ? { cookieDays: Number.isFinite(cookieDays) ? cookieDays : undefined, clickIdParam: clickIdParam || undefined, secretRef: secretRef || undefined }
          : undefined,
      verification: {
        source: String(this.form.get('verificationSource')?.value || '').trim() || undefined,
        verifiedAt: this.form.get('verifiedAt')?.value || undefined,
        status: this.form.get('verificationStatus')?.value,
      },
    };
  }

  private load(): void {
    this.loading = true;
    this.error = null;
    this.service.listPrograms().subscribe({
      next: (programs) => {
        this.programs = programs;
        this.loading = false;
        this.lastUpdatedChange.emit(new Date());
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudieron cargar los programas.';
      },
    });
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
