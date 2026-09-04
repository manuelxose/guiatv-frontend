import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ChatRecommendationCardComponent } from './chat-recommendation-card.component';
import { AffiliateService } from '../../../services/affiliate.service';
import { ChatbotRecommendation } from '../../../interfaces/chatbot.interface';

function recommendation(overrides: Partial<ChatbotRecommendation> = {}): ChatbotRecommendation {
  return {
    title: 'Interstellar',
    type: 'movie',
    reason: 'Coincide con tu búsqueda.',
    ...overrides,
  };
}

describe('ChatRecommendationCardComponent — affiliate CTA', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ChatRecommendationCardComponent],
      providers: [
        { provide: AffiliateService, useValue: { buildOutboundUrl: () => null, trackImpressions: () => {} } },
      ],
    });
  });

  it('renders no CTA and no disclosure when the response carries no affiliateActions', () => {
    const fixture = TestBed.createComponent(ChatRecommendationCardComponent);
    fixture.componentInstance.recommendation = recommendation();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('app-affiliate-cta'))).toBeNull();
    expect(fixture.debugElement.query(By.css('app-affiliate-disclosure'))).toBeNull();
  });

  it('renders the CTA with the server-resolved label/href when affiliateActions is present', () => {
    const fixture = TestBed.createComponent(ChatRecommendationCardComponent);
    fixture.componentInstance.recommendation = recommendation({
      channel: 'Movistar Plus+',
      channelOrPlatform: 'Movistar Plus+',
      affiliateActions: [
        {
          offerId: 'offer-1',
          label: 'Ver en Movistar Plus+',
          provider: 'Movistar Plus+',
          outboundPath: '/v2/affiliate/go/offer-1?placement=chatbot-answer&market=ES',
          disclosure: 'Enlace afiliado: GuíaTV puede recibir una comisión.',
          sponsored: true,
        },
      ],
    });
    fixture.detectChanges();

    const ctaEl = fixture.debugElement.query(By.css('app-affiliate-cta'));
    expect(ctaEl).not.toBeNull();
    const cta = ctaEl.componentInstance.cta();
    expect(cta.label).toBe('Ver en Movistar Plus+');
    expect(cta.sponsored).toBe(true);
    expect(ctaEl.componentInstance.href()).toBe('/v2/affiliate/go/offer-1?placement=chatbot-answer&market=ES');

    expect(fixture.debugElement.query(By.css('app-affiliate-disclosure'))).not.toBeNull();
  });

  it('never renders raw affiliate HTML/links outside the AffiliateCTAComponent', () => {
    const fixture = TestBed.createComponent(ChatRecommendationCardComponent);
    fixture.componentInstance.recommendation = recommendation({
      affiliateActions: [
        {
          offerId: 'offer-2',
          label: 'Ver oferta',
          provider: 'DAZN',
          outboundPath: '/v2/affiliate/go/offer-2',
          disclosure: 'Enlace afiliado',
          sponsored: true,
        },
      ],
    });
    fixture.detectChanges();

    // Every anchor pointing at an affiliate outbound path must live inside app-affiliate-cta —
    // the card itself never writes an affiliate `<a>` (or raw HTML link) directly.
    const outboundLinks = Array.from(
      fixture.nativeElement.querySelectorAll('a[href*="/v2/affiliate/go/"]')
    ) as HTMLElement[];
    expect(outboundLinks.length).toBeGreaterThan(0);
    for (const link of outboundLinks) {
      expect(link.closest('app-affiliate-cta')).not.toBeNull();
    }
  });
});
