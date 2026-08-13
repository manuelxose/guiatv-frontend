import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserProfile } from '../../../../interfaces/user.interface';

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/70" (click)="onClose()" aria-hidden="true"></div>

      <div
        class="relative w-full max-w-2xl bg-[var(--portal-surface)] border border-[var(--portal-border)] rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
      >
        <div class="px-6 py-4 border-b border-[var(--portal-border)] flex items-center justify-between">
          <h2 id="edit-profile-title" class="text-lg font-semibold text-[var(--portal-text)]">Editar perfil</h2>
          <button
            type="button"
            (click)="onClose()"
            class="min-h-[44px] px-3 rounded-lg border border-[var(--portal-border)] text-xs text-[var(--portal-text-soft)] hover:text-[var(--portal-text)] hover:border-[var(--portal-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label="Cerrar"
          >
            Cerrar
          </button>
        </div>

        <div class="p-6 max-h-[80vh] overflow-y-auto">
          <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div class="flex items-center gap-6">
              <div class="relative">
                <div class="h-24 w-24 rounded-2xl bg-[var(--portal-surface-strong)] border border-[var(--portal-border)] overflow-hidden">
                  <img [src]="profileForm.get('avatar')?.value || '/assets/gpt-avatar.png'" class="w-full h-full object-cover" alt="" />
                </div>
              </div>
              <div class="flex-1 space-y-2">
                <label for="profile-avatar" class="text-xs text-[var(--portal-text-muted)] uppercase tracking-wider">URL del avatar</label>
                <input
                  id="profile-avatar"
                  type="text"
                  formControlName="avatar"
                  class="w-full min-h-[44px] bg-[var(--portal-bg-deep)] border border-[var(--portal-border)] rounded-xl px-4 text-sm text-[var(--portal-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                />
              </div>
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label for="profile-name" class="text-xs text-[var(--portal-text-muted)] uppercase tracking-wider">Nombre</label>
                <input
                  id="profile-name"
                  type="text"
                  formControlName="name"
                  class="w-full min-h-[44px] bg-[var(--portal-bg-deep)] border border-[var(--portal-border)] rounded-xl px-4 text-sm text-[var(--portal-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                />
              </div>
              <div class="space-y-2">
                <label for="profile-username" class="text-xs text-[var(--portal-text-muted)] uppercase tracking-wider">Usuario</label>
                <div class="relative">
                  <span class="absolute left-4 top-3 text-[var(--portal-text-muted)]">&#64;</span>
                  <input
                    type="text"
                    id="profile-username"
                    formControlName="username"
                    class="w-full min-h-[44px] bg-[var(--portal-bg-deep)] border border-[var(--portal-border)] rounded-xl pl-8 pr-4 text-sm text-[var(--portal-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  />
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <label for="profile-bio" class="text-xs text-[var(--portal-text-muted)] uppercase tracking-wider">Bio</label>
              <textarea
                id="profile-bio"
                formControlName="bio"
                rows="3"
                class="w-full bg-[var(--portal-bg-deep)] border border-[var(--portal-border)] rounded-xl px-4 py-3 text-sm text-[var(--portal-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 resize-none"
              ></textarea>
            </div>

            <div class="space-y-2">
              <label for="profile-location" class="text-xs text-[var(--portal-text-muted)] uppercase tracking-wider">Ubicacion</label>
              <input
                id="profile-location"
                type="text"
                formControlName="location"
                class="w-full min-h-[44px] bg-[var(--portal-bg-deep)] border border-[var(--portal-border)] rounded-xl px-4 text-sm text-[var(--portal-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              />
            </div>

            <div class="border-t border-[var(--portal-border)] pt-6 space-y-4">
              <h3 class="text-sm text-[var(--portal-text-soft)] font-semibold uppercase tracking-wider">Seguridad</h3>
              <p *ngIf="passwordSuccess" class="text-sm text-green-400">{{ passwordSuccess }}</p>
              <p *ngIf="passwordError" class="text-sm text-red-400">{{ passwordError }}</p>
              <div class="space-y-4">
                <div class="space-y-2">
                  <label for="profile-current-password" class="text-xs text-[var(--portal-text-muted)] uppercase tracking-wider">Contrasena actual</label>
                  <input
                    id="profile-current-password"
                    type="password"
                    formControlName="currentPassword"
                    class="w-full min-h-[44px] bg-[var(--portal-bg-deep)] border border-[var(--portal-border)] rounded-xl px-4 text-sm text-[var(--portal-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  />
                </div>
                <div class="grid md:grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label for="profile-new-password" class="text-xs text-[var(--portal-text-muted)] uppercase tracking-wider">Nueva contrasena</label>
                    <input
                      id="profile-new-password"
                      type="password"
                      formControlName="password"
                      class="w-full min-h-[44px] bg-[var(--portal-bg-deep)] border border-[var(--portal-border)] rounded-xl px-4 text-sm text-[var(--portal-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    />
                  </div>
                  <div class="space-y-2">
                    <label for="profile-confirm-password" class="text-xs text-[var(--portal-text-muted)] uppercase tracking-wider">Confirmar contrasena</label>
                    <input
                      id="profile-confirm-password"
                      type="password"
                      formControlName="confirmPassword"
                      class="w-full min-h-[44px] bg-[var(--portal-bg-deep)] border border-[var(--portal-border)] rounded-xl px-4 text-sm text-[var(--portal-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div class="px-6 py-4 border-t border-[var(--portal-border)] flex justify-end gap-3">
          <button
            type="button"
            (click)="onClose()"
            class="min-h-[44px] px-4 rounded-xl border border-[var(--portal-border)] text-[var(--portal-text-soft)] hover:text-[var(--portal-text)] hover:border-[var(--portal-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Cancelar
          </button>
          <button
            type="button"
            (click)="onSubmit()"
            [disabled]="profileForm.invalid"
            class="min-h-[44px] px-6 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  `,
})
export class EditProfileModalComponent {
  @Input() isOpen = false;
  @Input() set profile(value: UserProfile | null) {
    if (value) {
      this.profileForm.patchValue({
        name: value.name,
        username: value.username,
        bio: value.bio,
        location: value.location,
        avatar: value.avatar,
      });
    }
  }
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveProfile = new EventEmitter<Partial<UserProfile>>();
  @Output() changePassword = new EventEmitter<{ currentPassword: string; newPassword: string }>();

  profileForm: FormGroup;
  passwordError = '';
  passwordSuccess = '';

  constructor(private fb: FormBuilder) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      username: ['', Validators.required],
      bio: [''],
      location: [''],
      avatar: [''],
      currentPassword: [''],
      password: [''],
      confirmPassword: [''],
    });
  }

  onClose() {
    this.passwordError = '';
    this.passwordSuccess = '';
    this.closeModal.emit();
  }

  onSubmit() {
    if (this.profileForm.valid) {
      const formValue = this.profileForm.value;
      const { currentPassword, password, confirmPassword, ...profileData } = formValue;
      this.saveProfile.emit(profileData);

      this.passwordError = '';
      this.passwordSuccess = '';

      if (password || currentPassword) {
        if (!currentPassword) {
          this.passwordError = 'Introduce tu contraseña actual.';
          return;
        }
        if (!password || password.length < 8) {
          this.passwordError = 'La nueva contraseña debe tener al menos 8 caracteres.';
          return;
        }
        if (password !== confirmPassword) {
          this.passwordError = 'Las contraseñas no coinciden.';
          return;
        }
        this.changePassword.emit({ currentPassword, newPassword: password });
      }
    }
  }

  onPasswordChangeResult(success: boolean, message: string) {
    if (success) {
      this.passwordSuccess = message;
      this.passwordError = '';
      this.profileForm.patchValue({ currentPassword: '', password: '', confirmPassword: '' });
    } else {
      this.passwordError = message;
      this.passwordSuccess = '';
    }
  }
}
