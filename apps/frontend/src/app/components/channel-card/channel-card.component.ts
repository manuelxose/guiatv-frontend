import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TvReadChannelSummaryDTO } from '../../api/models';
import { formatMadridHM } from '../../utils/madrid-time';

@Component({
  selector: 'app-channel-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './channel-card.component.html',
  styleUrl: './channel-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelCardComponent {
  readonly entry = input.required<TvReadChannelSummaryDTO>();
  readonly headingLevel = input<2 | 3>(2);

  formatTime(value?: string): string {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : formatMadridHM(date);
  }

  accessLabel(): string {
    const access = this.entry().channel.access;
    if (access === 'free') return 'En abierto';
    if (access === 'pay') return 'De pago';
    return 'Acceso sin confirmar';
  }

  handleLogoError(event: Event): void {
    const image = event.target as HTMLImageElement | null;
    if (image) image.hidden = true;
  }
}
