import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-unified-async-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unified-async-state.component.html',
  styleUrl: './unified-async-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': "kind() === 'error' ? 'alert' : null",
  },
})
export class UnifiedAsyncStateComponent {
  readonly kind = input.required<'empty' | 'error'>();
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly actionLabel = input<string>();
  readonly action = output<void>();
}
