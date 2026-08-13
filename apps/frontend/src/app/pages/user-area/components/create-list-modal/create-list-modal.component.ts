import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-create-list-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/70" (click)="close()" aria-hidden="true"></div>

      <div
        class="relative w-full max-w-sm bg-[var(--portal-surface)] border border-[var(--portal-border)] rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-list-title"
      >
        <div class="p-5 space-y-4">
          <h2 id="create-list-title" class="text-lg font-semibold text-[var(--portal-text)]">Nueva lista</h2>

          <form [formGroup]="listForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <input
              #titleInput
              type="text"
              formControlName="title"
              (keydown.enter)="onSubmit()"
              class="w-full min-h-[44px] bg-[var(--portal-bg-deep)] border border-[var(--portal-border)] rounded-xl px-4 text-sm text-[var(--portal-text)] placeholder:text-[var(--portal-text-faint)] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              placeholder="Nombre de la lista"
            />

            <div class="flex rounded-xl border border-[var(--portal-border)] overflow-hidden">
              <label *ngFor="let opt of visibilityOptions" class="flex-1 cursor-pointer">
                <input type="radio" formControlName="visibility" [value]="opt.value" class="sr-only peer" />
                <div class="text-center py-2.5 text-xs font-semibold uppercase tracking-wider border-r border-[var(--portal-border)] last:border-r-0 peer-checked:bg-red-600/20 peer-checked:text-red-200 text-[var(--portal-text-muted)] transition-colors">
                  {{ opt.label }}
                </div>
              </label>
            </div>

            <div class="flex gap-3">
              <button
                type="button"
                (click)="close()"
                class="min-h-[44px] flex-1 px-4 rounded-xl border border-[var(--portal-border)] text-[var(--portal-text-soft)] hover:text-[var(--portal-text)] hover:border-[var(--portal-border-strong)] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                [disabled]="listForm.invalid"
                class="min-h-[44px] flex-1 px-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Crear
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class CreateListModalComponent implements AfterViewInit {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() createList = new EventEmitter<{ title: string; description: string; visibility: 'public' | 'friends' | 'private' }>();
  @ViewChild('titleInput') titleInput?: ElementRef<HTMLInputElement>;

  readonly visibilityOptions = [
    { value: 'public', label: 'Público' },
    { value: 'friends', label: 'Amigos' },
    { value: 'private', label: 'Privado' },
  ];

  listForm = this.fb.group({
    title: ['', Validators.required],
    visibility: ['public'],
  });

  constructor(private fb: FormBuilder) {}

  ngAfterViewInit(): void {
    this.focusTitle();
  }

  focusTitle(): void {
    setTimeout(() => this.titleInput?.nativeElement?.focus(), 50);
  }

  close() {
    this.closeModal.emit();
    this.listForm.reset({ visibility: 'public' });
  }

  onSubmit() {
    if (this.listForm.valid) {
      const { title, visibility } = this.listForm.value;
      this.createList.emit({ title: title!, description: '', visibility: visibility as any });
      this.close();
    }
  }
}
