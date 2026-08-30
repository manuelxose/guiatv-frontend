import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Consistent, non-deceptive commercial disclosure copy. Kept in one place so every surface reads the same sentence. */
export const DEFAULT_AFFILIATE_DISCLOSURE_TEXT =
  'Enlace afiliado: GuíaTV puede recibir una comisión sin coste adicional para ti.';

/**
 * One disclosure line, meant to be mounted once per surface/section — never
 * once per card — so affiliate transparency stays legible without becoming
 * visual noise. Renders nothing when `sponsored` is false: a non-affiliate
 * "direct link to provider" offer has nothing to disclose, and the calling
 * page should simply omit the component rather than pass a permanently-off flag.
 */
@Component({
  selector: 'app-affiliate-disclosure',
  standalone: true,
  template: `
    @if (sponsored()) {
      <p class="affiliate-disclosure" [class.affiliate-disclosure--compact]="compact()">
        {{ text() }}
      </p>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .affiliate-disclosure {
        margin: 0;
        color: var(--portal-text-muted);
        font-size: var(--text-2xs);
        line-height: 1.5;
      }

      .affiliate-disclosure--compact {
        font-size: var(--text-2xs);
        opacity: 0.85;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AffiliateDisclosureComponent {
  readonly text = input(DEFAULT_AFFILIATE_DISCLOSURE_TEXT);
  /** Whether there is anything commercial to disclose. Defaults on so a caller must opt out deliberately, not forget to opt in. */
  readonly sponsored = input(true);
  /** Smaller, lower-emphasis rendering for tight spaces (a card footer) vs. a dedicated section (a comparison page aside). */
  readonly compact = input(false);
}
