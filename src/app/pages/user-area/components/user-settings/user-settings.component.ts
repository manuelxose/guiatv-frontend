import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UserNotifications, UserPrivacy, UserProfile } from '../../../../interfaces/user.interface';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-3xl mx-auto space-y-6">
      <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold text-white">Ajustes de cuenta</h2>
            <p class="text-sm text-slate-400">Controla tu perfil, privacidad y notificaciones.</p>
          </div>
          <button
            type="button"
            (click)="onEditProfile()"
            class="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Editar perfil
          </button>
        </div>

        <form [formGroup]="settingsForm" (ngSubmit)="onSubmit()" class="space-y-8 mt-6">
          <!-- Profile -->
          <section class="space-y-4">
            <h3 class="text-xs text-slate-500 uppercase tracking-[0.3em]">Perfil</h3>
            <div class="grid sm:grid-cols-2 gap-4">
              <div class="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                <p class="text-xs text-slate-500 uppercase tracking-wider">Nombre</p>
                <p class="text-sm text-slate-200 mt-2">{{ profile?.name || '-' }}</p>
              </div>
              <div class="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                <p class="text-xs text-slate-500 uppercase tracking-wider">Usuario</p>
                <p class="text-sm text-slate-200 mt-2">{{ profile?.username || '-' }}</p>
              </div>
              <div class="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                <p class="text-xs text-slate-500 uppercase tracking-wider">Email</p>
                <p class="text-sm text-slate-200 mt-2">{{ profile?.email || '-' }}</p>
              </div>
              <div class="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                <p class="text-xs text-slate-500 uppercase tracking-wider">Ubicacion</p>
                <p class="text-sm text-slate-200 mt-2">{{ profile?.location || '-' }}</p>
              </div>
            </div>
          </section>

          <!-- Security -->
          <section class="space-y-4">
            <h3 class="text-xs text-slate-500 uppercase tracking-[0.3em]">Seguridad</h3>
            <div class="grid sm:grid-cols-2 gap-4">
              <div class="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                <p class="text-sm text-white font-medium">Contrasena</p>
                <p class="text-xs text-slate-500 mt-1">Ultima actualizacion: hace 2 meses</p>
                <button
                  type="button"
                  class="min-h-[44px] px-4 mt-4 rounded-lg border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  Cambiar contrasena
                </button>
              </div>

              <div class="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-4">
                <label class="flex items-center justify-between gap-4">
                  <div>
                    <span class="text-sm text-white font-medium block">Doble factor</span>
                    <span class="text-xs text-slate-500">Proteccion extra para iniciar sesion</span>
                  </div>
                  <div class="relative inline-flex items-center">
                    <input type="checkbox" formControlName="twoFactor" class="sr-only peer" />
                    <div class="w-11 h-6 bg-slate-700 rounded-full peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-red-500 peer-checked:bg-red-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </div>
                </label>

                <label class="flex items-center justify-between gap-4">
                  <div>
                    <span class="text-sm text-white font-medium block">Alertas de acceso</span>
                    <span class="text-xs text-slate-500">Notificar inicios de sesion nuevos</span>
                  </div>
                  <div class="relative inline-flex items-center">
                    <input type="checkbox" formControlName="loginAlerts" class="sr-only peer" />
                    <div class="w-11 h-6 bg-slate-700 rounded-full peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-red-500 peer-checked:bg-red-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </div>
                </label>
              </div>
            </div>
          </section>

          <!-- Privacy -->
          <section class="space-y-4">
            <h3 class="text-xs text-slate-500 uppercase tracking-[0.3em]">Privacidad</h3>

            <div class="space-y-3">
              <label class="flex items-center justify-between p-4 rounded-xl border border-slate-800/80 bg-slate-950/60">
                <div>
                  <span class="text-sm text-white font-medium block">Perfil publico</span>
                  <span class="text-xs text-slate-500">Permite que otros usuarios vean tu perfil</span>
                </div>
                <div class="relative inline-flex items-center">
                  <input type="checkbox" formControlName="profilePublic" class="sr-only peer" />
                  <div class="w-11 h-6 bg-slate-700 rounded-full peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-red-500 peer-checked:bg-red-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </div>
              </label>

              <label class="flex items-center justify-between p-4 rounded-xl border border-slate-800/80 bg-slate-950/60">
                <div>
                  <span class="text-sm text-white font-medium block">Compartir actividad</span>
                  <span class="text-xs text-slate-500">Publicar automaticamente lo que ves</span>
                </div>
                <div class="relative inline-flex items-center">
                  <input type="checkbox" formControlName="shareActivity" class="sr-only peer" />
                  <div class="w-11 h-6 bg-slate-700 rounded-full peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-red-500 peer-checked:bg-red-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </div>
              </label>

              <label class="flex items-center justify-between p-4 rounded-xl border border-slate-800/80 bg-slate-950/60">
                <div>
                  <span class="text-sm text-white font-medium block">Mostrar en linea</span>
                  <span class="text-xs text-slate-500">Tus amigos pueden ver cuando estas conectado</span>
                </div>
                <div class="relative inline-flex items-center">
                  <input type="checkbox" formControlName="showOnline" class="sr-only peer" />
                  <div class="w-11 h-6 bg-slate-700 rounded-full peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-red-500 peer-checked:bg-red-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </div>
              </label>
            </div>
          </section>

          <!-- Notifications -->
          <section class="space-y-4">
            <h3 class="text-xs text-slate-500 uppercase tracking-[0.3em]">Notificaciones</h3>

            <div class="space-y-3">
              <label class="flex items-center justify-between p-4 rounded-xl border border-slate-800/80 bg-slate-950/60">
                <div>
                  <span class="text-sm text-white font-medium block">Recomendaciones</span>
                  <span class="text-xs text-slate-500">Alertas de recomendaciones de amigos</span>
                </div>
                <div class="relative inline-flex items-center">
                  <input type="checkbox" formControlName="recommendations" class="sr-only peer" />
                  <div class="w-11 h-6 bg-slate-700 rounded-full peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-red-500 peer-checked:bg-red-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </div>
              </label>

              <label class="flex items-center justify-between p-4 rounded-xl border border-slate-800/80 bg-slate-950/60">
                <div>
                  <span class="text-sm text-white font-medium block">Nuevos seguidores</span>
                  <span class="text-xs text-slate-500">Avisarme cuando alguien me siga</span>
                </div>
                <div class="relative inline-flex items-center">
                  <input type="checkbox" formControlName="followers" class="sr-only peer" />
                  <div class="w-11 h-6 bg-slate-700 rounded-full peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-red-500 peer-checked:bg-red-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </div>
              </label>

              <label class="flex items-center justify-between p-4 rounded-xl border border-slate-800/80 bg-slate-950/60">
                <div>
                  <span class="text-sm text-white font-medium block">Resumen semanal</span>
                  <span class="text-xs text-slate-500">Recibir un resumen cada semana</span>
                </div>
                <div class="relative inline-flex items-center">
                  <input type="checkbox" formControlName="weeklySummary" class="sr-only peer" />
                  <div class="w-11 h-6 bg-slate-700 rounded-full peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-red-500 peer-checked:bg-red-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </div>
              </label>
            </div>
          </section>

          <div class="pt-6 border-t border-slate-800/80 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              class="min-h-[44px] px-6 py-2.5 rounded-xl border border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="min-h-[44px] px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>

      <div class="text-center">
        <button
          type="button"
          class="min-h-[44px] px-6 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          Cerrar sesion
        </button>
      </div>
    </div>
  `,
  styles: [],
})
export class UserSettingsComponent {
  @Input() profile: UserProfile | null = null;
  @Input() privacy!: UserPrivacy;
  @Input() notifications!: UserNotifications;
  @Output() saveSettings = new EventEmitter<{ privacy: UserPrivacy; notifications: UserNotifications }>();
  @Output() editProfile = new EventEmitter<void>();

  settingsForm = this.fb.group({
    profilePublic: [true],
    shareActivity: [true],
    shareWatchlist: [true],
    showOnline: [true],
    recommendations: [true],
    followers: [true],
    weeklySummary: [false],
    twoFactor: [false],
    loginAlerts: [true],
  });

  constructor(private fb: FormBuilder) {}

  ngOnChanges() {
    if (this.privacy && this.notifications) {
      this.settingsForm.patchValue({
        profilePublic: this.privacy.profilePublic,
        shareActivity: this.privacy.shareActivity,
        shareWatchlist: this.privacy.shareWatchlist,
        showOnline: this.privacy.showOnline,
        recommendations: this.notifications.recommendations,
        followers: this.notifications.followers,
        weeklySummary: this.notifications.weeklySummary,
      });
    }
  }

  onEditProfile() {
    this.editProfile.emit();
  }

  onSubmit() {
    if (this.settingsForm.valid) {
      const val = this.settingsForm.value;
      this.saveSettings.emit({
        privacy: {
          profilePublic: !!val.profilePublic,
          shareActivity: !!val.shareActivity,
          shareWatchlist: !!val.shareWatchlist,
          showOnline: !!val.showOnline,
          allowMessages: 'all',
          publicLists: true,
        },
        notifications: {
          recommendations: !!val.recommendations,
          followers: !!val.followers,
          weeklySummary: !!val.weeklySummary,
          chatMessages: true,
          groupActivity: true,
        },
      });
    }
  }
}
