import { ChangeDetectionStrategy, Component, EventEmitter, Output, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PortalContextDestination } from '../../config/portal-navigation.config';

@Component({
  selector: 'app-portal-local-toolbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './portal-local-toolbar.component.html',
  styleUrl: './portal-local-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalLocalToolbarComponent {
  readonly items = input.required<readonly PortalContextDestination[]>();
  readonly active = input<string | null>(null);
  readonly ariaLabel = input('Opciones de la sección');
  @Output() readonly itemSelect = new EventEmitter<string>();
}
