import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-platform-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './platform-badge.component.html',
  styleUrl: './platform-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformBadgeComponent {
  @Input({ required: true }) label = '';
  @Input() color = '#334155';
  @Input() logoUrl = '';

  get toneClass(): string {
    return `platform-badge--${resolveBadgeTone(this.color, this.label)}`;
  }

  get resolvedLogoUrl(): string {
    const provided = String(this.logoUrl || '').trim();
    if (provided) return provided.replace('/t/p/original/', '/t/p/w92/');

    // Known platform logos from TMDB image CDN — fuzzy match by keyword
    const knownLogos: Array<[string, string]> = [
      ['netflix', 'https://image.tmdb.org/t/p/w92/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg'],
      ['prime video', 'https://image.tmdb.org/t/p/original/emthp39XA2YScoYL1p0sdbAH2WA.jpg'],
      ['amazon', 'https://image.tmdb.org/t/p/original/emthp39XA2YScoYL1p0sdbAH2WA.jpg'],
      ['disney', 'https://image.tmdb.org/t/p/original/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg'],
      ['hbo', 'https://image.tmdb.org/t/p/original/6Q3KKEFIL3dIFqx51poNXseNoSk.jpg'],
      ['max', 'https://image.tmdb.org/t/p/original/6Q3KKEFIL3dIFqx51poNXseNoSk.jpg'],
      ['movistar', 'https://image.tmdb.org/t/p/original/cDQbECpn23odNRHUVR5JcAKbhDs.jpg'],
      ['skyshowtime', 'https://image.tmdb.org/t/p/original/hR9vWd8hWEVQKD6eOnBneKRFEW3.jpg'],
      ['apple tv', 'https://image.tmdb.org/t/p/original/6uhKBfmtzFqOcLousHwZuzcrScK.jpg'],
      ['filmin', 'https://image.tmdb.org/t/p/original/bFb9IJXZ0IVnYuKbWAJbjYRPccY.jpg'],
      ['rtve', 'https://image.tmdb.org/t/p/original/oy4e1BSJhiUHTNwwbHqcJ5X4Gzf.jpg'],
      ['atresplayer', 'https://image.tmdb.org/t/p/original/k9UiVfG9ArLdaxWdvfS2nSIxEYj.jpg'],
      ['mitele', 'https://image.tmdb.org/t/p/original/6Cxs2ffW2XKGIJLE7CW0qtchd4K.jpg'],
      ['pluto', 'https://image.tmdb.org/t/p/original/t6N57S17sdXRXmZDAkaGP0NHNG0.jpg'],
      ['rakuten', 'https://image.tmdb.org/t/p/original/5GEbAhFW2S5T8QwqOuaFpgZFzPi.jpg'],
      ['mubi', 'https://image.tmdb.org/t/p/original/bVR4Z1LCHY7gidXAJF5pMa4QrDS.jpg'],
      ['starz', 'https://image.tmdb.org/t/p/original/xbhHHa1YejSO5943BmzXRDmZqa1.jpg'],
    ];

    const normalized = this.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const [keyword, url] of knownLogos) {
      if (normalized.includes(keyword)) return url.replace('/t/p/original/', '/t/p/w92/');
    }

    return '';
  }

  get hasLogo(): boolean {
    return Boolean(this.resolvedLogoUrl);
  }

  get initials(): string {
    const normalized = String(this.label || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');

    return normalized || '?';
  }
}


// Mirrors the 7 tone-variant colors hardcoded in platform-badge.component.scss
// (.platform-badge--red/blue/cyan/violet/green/amber/slate) — keep both in
// sync. Exported so other components that need the same platform→color
// mapping for interactive UI (e.g. clickable chips, which this read-only
// badge component doesn't support) can reuse the color source without
// duplicating a second brand-hex list.
export const PLATFORM_BADGE_TONE_COLORS: Record<string, { bg: string; border: string; color: string }> = {
  slate: { bg: 'rgba(100, 116, 139, 0.08)', border: 'rgba(100, 116, 139, 0.3)', color: '#475569' },
  red: { bg: 'rgba(220, 38, 38, 0.08)', border: 'rgba(220, 38, 38, 0.3)', color: '#a91616' },
  blue: { bg: 'rgba(37, 99, 235, 0.08)', border: 'rgba(37, 99, 235, 0.3)', color: '#1746b3' },
  cyan: { bg: 'rgba(6, 182, 212, 0.08)', border: 'rgba(6, 182, 212, 0.3)', color: '#075f78' },
  violet: { bg: 'rgba(124, 58, 237, 0.08)', border: 'rgba(124, 58, 237, 0.3)', color: '#6630c7' },
  green: { bg: 'rgba(22, 163, 74, 0.08)', border: 'rgba(22, 163, 74, 0.3)', color: '#0d7431' },
  amber: { bg: 'rgba(217, 119, 6, 0.08)', border: 'rgba(217, 119, 6, 0.3)', color: '#965105' },
};

export function resolveBadgeTone(color: string, label: string): string {
  const safeColor = String(color || '').toLowerCase();
  const safeLabel = String(label || '').toLowerCase();

  if (
    safeLabel.includes('netflix') ||
    safeLabel.includes('rakuten') ||
    safeLabel.includes('atresplayer') ||
    safeColor.includes('e50914') ||
    safeColor.includes('ef4444') ||
    safeColor.includes('dc2626')
  ) {
    return 'red';
  }

  if (
    safeLabel.includes('prime') ||
    safeLabel.includes('max') ||
    safeLabel.includes('hbo') ||
    safeLabel.includes('movistar') ||
    safeColor.includes('3b82f6') ||
    safeColor.includes('2563eb') ||
    safeColor.includes('1d4ed8')
  ) {
    return 'blue';
  }

  if (
    safeLabel.includes('disney') ||
    safeLabel.includes('skyshowtime') ||
    safeColor.includes('06b6d4') ||
    safeColor.includes('0891b2')
  ) {
    return 'cyan';
  }

  if (
    safeLabel.includes('filmin') ||
    safeLabel.includes('apple') ||
    safeColor.includes('8b5cf6') ||
    safeColor.includes('7c3aed')
  ) {
    return 'violet';
  }

  if (
    safeLabel.includes('pluto') ||
    safeLabel.includes('rtve') ||
    safeLabel.includes('gratis') ||
    safeColor.includes('22c55e') ||
    safeColor.includes('16a34a')
  ) {
    return 'green';
  }

  if (
    safeLabel.includes('mubi') ||
    safeLabel.includes('starz') ||
    safeColor.includes('f59e0b') ||
    safeColor.includes('d97706')
  ) {
    return 'amber';
  }

  return 'slate';
}
