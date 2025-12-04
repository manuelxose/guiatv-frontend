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
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" (click)="onClose()"></div>

      <!-- Modal -->
      <div class="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
          <h2 class="text-xl font-bold text-white">Editar Perfil</h2>
          <button (click)="onClose()" class="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 max-h-[80vh] overflow-y-auto">
          <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="space-y-6">
            
            <!-- Avatar Section -->
            <div class="flex items-center gap-6">
              <div class="relative group">
                <div class="h-24 w-24 rounded-2xl bg-gray-800 overflow-hidden border-2 border-gray-700 group-hover:border-red-500 transition-colors">
                  <img [src]="profileForm.get('avatar')?.value || '/assets/gpt-avatar.png'" class="w-full h-full object-cover">
                </div>
                <button type="button" class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium text-xs">
                  Cambiar
                </button>
              </div>
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-400 mb-2">URL del Avatar</label>
                <input type="text" formControlName="avatar" class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors">
              </div>
            </div>

            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-2">Nombre</label>
                <input type="text" formControlName="name" class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-2">Usuario</label>
                <div class="relative">
                  <span class="absolute left-4 top-2 text-gray-500">&#64;</span>
                  <input type="text" formControlName="username" class="w-full bg-gray-800 border border-gray-700 rounded-xl pl-8 pr-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors">
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2">Bio</label>
              <textarea formControlName="bio" rows="3" class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors resize-none"></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-400 mb-2">Ubicación</label>
              <input type="text" formControlName="location" class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors">
            </div>

            <div class="border-t border-gray-800 pt-6">
              <h3 class="text-lg font-medium text-white mb-4">Seguridad</h3>
              <div class="grid md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-2">Nueva Contraseña</label>
                  <input type="password" formControlName="password" class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-2">Confirmar Contraseña</label>
                  <input type="password" formControlName="confirmPassword" class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors">
                </div>
              </div>
            </div>

          </form>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-800 bg-gray-900/50 flex justify-end gap-3">
          <button (click)="onClose()" class="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all font-medium">
            Cancelar
          </button>
          <button (click)="onSubmit()" [disabled]="profileForm.invalid" class="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg shadow-red-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  `
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
        avatar: value.avatar
      });
    }
  }
  @Output() closeModal = new EventEmitter<void>();
  @Output() saveProfile = new EventEmitter<Partial<UserProfile>>();

  profileForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      username: ['', Validators.required],
      bio: [''],
      location: [''],
      avatar: [''],
      password: [''],
      confirmPassword: ['']
    });
  }

  onClose() {
    this.closeModal.emit();
  }

  onSubmit() {
    if (this.profileForm.valid) {
      const formValue = this.profileForm.value;
      // Remove password fields from the profile object we emit
      const { password, confirmPassword, ...profileData } = formValue;
      this.saveProfile.emit(profileData);
    }
  }
}
