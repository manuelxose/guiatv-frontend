import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AdminAffiliateNetwork,
  AdminAffiliateService,
  AdminNetworkInput,
  AdminNetworkStatus,
  AdminNetworkTrackingType,
} from '../../../../services/admin-affiliate.service';

@Component({
  selector: 'app-admin-affiliate-networks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-affiliate-networks.component.html',
})
export class AdminAffiliateNetworksComponent implements OnInit {
  @Output() lastUpdatedChange = new EventEmitter<Date>();

  public readonly trackingTypeOptions: Array<{ id: AdminNetworkTrackingType; label: string }> = [
    { id: 'direct', label: 'Directo (sin red)' },
    { id: 'url_template', label: 'Plantilla de URL' },
    { id: 'redirect_endpoint', label: 'Endpoint de redirección' },
    { id: 'tag_param', label: 'Parámetro de tag' },
    { id: 'api', label: 'API' },
  ];

  public networks: AdminAffiliateNetwork[] = [];
  public loading = false;
  public error: string | null = null;
  public saving = false;
  public saveError: string | null = null;
  public saveSuccess: string | null = null;
  public selectedId: string | null = null;
  public form: FormGroup;

  constructor(private readonly service: AdminAffiliateService, private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      trackingType: ['url_template' as AdminNetworkTrackingType],
      markets: ['ES'],
      status: ['active' as AdminNetworkStatus],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  get isEditing(): boolean {
    return Boolean(this.selectedId);
  }

  refresh(): void {
    this.load();
  }

  submit(): void {
    if (this.saving) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.saveError = 'El nombre es obligatorio.';
      return;
    }

    const input: AdminNetworkInput = {
      name: String(this.form.get('name')?.value || '').trim(),
      trackingType: this.form.get('trackingType')?.value,
      markets: String(this.form.get('markets')?.value || '')
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean),
      status: this.form.get('status')?.value,
    };

    this.saving = true;
    this.saveError = null;
    this.saveSuccess = null;

    const request$ = this.selectedId ? this.service.updateNetwork(this.selectedId, input) : this.service.createNetwork(input);
    request$.subscribe({
      next: () => {
        this.saving = false;
        this.saveSuccess = this.selectedId ? 'Red actualizada.' : 'Red creada.';
        this.resetForm();
        this.load();
      },
      error: () => {
        this.saving = false;
        this.saveError = 'No se pudo guardar la red de afiliación.';
      },
    });
  }

  edit(network: AdminAffiliateNetwork): void {
    this.selectedId = network.id;
    this.saveError = null;
    this.saveSuccess = null;
    this.form.reset({
      name: network.name,
      trackingType: network.trackingType,
      markets: network.markets.join(', '),
      status: network.status,
    });
  }

  resetForm(): void {
    this.selectedId = null;
    this.form.reset({ name: '', trackingType: 'url_template', markets: 'ES', status: 'active' });
  }

  trackById(_index: number, network: AdminAffiliateNetwork): string {
    return network.id;
  }

  private load(): void {
    this.loading = true;
    this.error = null;
    this.service.listNetworks().subscribe({
      next: (networks) => {
        this.networks = networks;
        this.loading = false;
        this.lastUpdatedChange.emit(new Date());
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudieron cargar las redes de afiliación.';
      },
    });
  }
}
