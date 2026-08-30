import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminAffiliatePlacement, AdminAffiliateService } from '../../../../services/admin-affiliate.service';

/**
 * Placements tab. Existing placement *keys* are the resolver's live surface
 * allowlist (see `KNOWN_AFFILIATE_PLACEMENT_KEYS`) — this tab lets an admin
 * enable/disable a placement or add a new page's key without touching code,
 * but never lets the key of an existing row change (identity-stable).
 */
@Component({
  selector: 'app-admin-affiliate-placements',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-affiliate-placements.component.html',
})
export class AdminAffiliatePlacementsComponent implements OnInit {
  @Output() lastUpdatedChange = new EventEmitter<Date>();

  public placements: AdminAffiliatePlacement[] = [];
  public loading = false;
  public error: string | null = null;
  public saving = false;
  public saveError: string | null = null;
  public saveSuccess: string | null = null;
  public form: FormGroup;

  constructor(private readonly service: AdminAffiliateService, private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      key: ['', [Validators.required]],
      page: ['', [Validators.required]],
      description: [''],
      enabled: [true],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  refresh(): void {
    this.load();
  }

  submit(): void {
    if (this.saving) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.saveError = 'La clave y la página son obligatorias.';
      return;
    }
    this.saving = true;
    this.saveError = null;
    this.saveSuccess = null;
    this.service
      .createPlacement({
        key: String(this.form.get('key')?.value || '').trim(),
        page: String(this.form.get('page')?.value || '').trim(),
        description: String(this.form.get('description')?.value || '').trim() || undefined,
        enabled: Boolean(this.form.get('enabled')?.value),
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.saveSuccess = 'Placement creado.';
          this.form.reset({ key: '', page: '', description: '', enabled: true });
          this.load();
        },
        error: () => {
          this.saving = false;
          this.saveError = 'No se pudo crear el placement (¿la clave ya existe?).';
        },
      });
  }

  toggleEnabled(placement: AdminAffiliatePlacement): void {
    this.service
      .updatePlacement(placement.id, { page: placement.page, description: placement.description, enabled: !placement.enabled, legacyKeys: placement.legacyKeys })
      .subscribe({
        next: () => this.load(),
        error: () => {
          this.saveError = 'No se pudo actualizar el placement.';
        },
      });
  }

  trackById(_index: number, placement: AdminAffiliatePlacement): string {
    return placement.id;
  }

  private load(): void {
    this.loading = true;
    this.error = null;
    this.service.listPlacements().subscribe({
      next: (placements) => {
        this.placements = placements;
        this.loading = false;
        this.lastUpdatedChange.emit(new Date());
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudieron cargar los placements.';
      },
    });
  }
}
