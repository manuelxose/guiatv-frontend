import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UserNotifications, UserPrivacy } from '../../../../interfaces/user.interface';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-3xl mx-auto space-y-8">
      <div class="bg-gray-800/60 border border-gray-700/60 rounded-2xl p-8 shadow-xl shadow-black/20 backdrop-blur-sm">
        <h2 class="text-2xl font-bold text-white mb-6">Configuración de Cuenta</h2>
        
        <form [formGroup]="settingsForm" (ngSubmit)="onSubmit()" class="space-y-8">
          <!-- Privacy Section -->
          <section class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-300 border-b border-gray-700 pb-2">Privacidad</h3>
            
            <div class="space-y-3">
              <label class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                <div>
                  <span class="text-white font-medium block">Perfil Público</span>
                  <span class="text-sm text-gray-400">Permitir que otros usuarios vean tu perfil</span>
                </div>
                <div class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" formControlName="profilePublic" class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </div>
              </label>

              <label class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                <div>
                  <span class="text-white font-medium block">Compartir Actividad</span>
                  <span class="text-sm text-gray-400">Publicar automáticamente lo que ves</span>
                </div>
                <div class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" formControlName="shareActivity" class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </div>
              </label>

              <label class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                <div>
                  <span class="text-white font-medium block">Mostrar en línea</span>
                  <span class="text-sm text-gray-400">Tus amigos podrán ver cuando estás conectado</span>
                </div>
                <div class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" formControlName="showOnline" class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </div>
              </label>
            </div>
          </section>

          <!-- Notifications Section -->
          <section class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-300 border-b border-gray-700 pb-2">Notificaciones</h3>
            
            <div class="space-y-3">
              <label class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                <div>
                  <span class="text-white font-medium block">Recomendaciones</span>
                  <span class="text-sm text-gray-400">Recibir alertas de recomendaciones de amigos</span>
                </div>
                <div class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" formControlName="recommendations" class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </div>
              </label>

              <label class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                <div>
                  <span class="text-white font-medium block">Nuevos seguidores</span>
                  <span class="text-sm text-gray-400">Avisarme cuando alguien me siga</span>
                </div>
                <div class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" formControlName="followers" class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </div>
              </label>
            </div>
          </section>

          <div class="pt-6 border-t border-gray-700 flex justify-end gap-4">
            <button type="button" class="px-6 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-medium">Cancelar</button>
            <button type="submit" class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-red-900/20">Guardar Cambios</button>
          </div>
        </form>
      </div>
      
      <div class="text-center">
        <button class="text-red-500/60 hover:text-red-400 text-sm font-medium transition-colors">Cerrar Sesión</button>
      </div>
    </div>
  `,
  styles: []
})
export class UserSettingsComponent {
  @Input() privacy!: UserPrivacy;
  @Input() notifications!: UserNotifications;
  @Output() saveSettings = new EventEmitter<{ privacy: UserPrivacy; notifications: UserNotifications }>();

  settingsForm = this.fb.group({
    profilePublic: [true],
    shareActivity: [true],
    shareWatchlist: [true],
    showOnline: [true],
    recommendations: [true],
    followers: [true],
    weeklySummary: [false]
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
        weeklySummary: this.notifications.weeklySummary
      });
    }
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
          allowMessages: 'all', // Default or from form if added
          publicLists: true // Default or from form if added
        },
        notifications: {
          recommendations: !!val.recommendations,
          followers: !!val.followers,
          weeklySummary: !!val.weeklySummary,
          chatMessages: true, // Default or from form if added
          groupActivity: true // Default or from form if added
        }
      });
    }
  }
}
