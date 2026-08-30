import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AffiliateCTAComponent } from './affiliate-cta.component';
import { AffiliateService } from '../../services/affiliate.service';
import { AffiliateResolvedOffer } from '../../interfaces/affiliate.interface';

const SPONSORED_OFFER: AffiliateResolvedOffer = {
  offerId: 'offer-1',
  merchant: { id: 'm1', slug: 'netflix', name: 'Netflix' },
  category: 'streaming',
  plan: { id: 'standard', name: 'Estándar' },
  display: { disclosure: 'Enlace afiliado.' },
  cta: { label: 'Ver oferta', sponsored: true },
  outbound: { path: '/v2/affiliate/go/offer-1?placement=where-to-watch&market=ES' },
};

const DIRECT_OFFER: AffiliateResolvedOffer = {
  ...SPONSORED_OFFER,
  offerId: 'offer-2',
  cta: { label: 'Ir al proveedor', sponsored: false },
};

describe('AffiliateCTAComponent', () => {
  let buildOutboundUrl: jasmine.Spy;

  beforeEach(() => {
    buildOutboundUrl = jasmine.createSpy('buildOutboundUrl').and.callFake((offer: AffiliateResolvedOffer) => offer.outbound.path);
    TestBed.configureTestingModule({
      imports: [AffiliateCTAComponent],
      providers: [{ provide: AffiliateService, useValue: { buildOutboundUrl } }],
    });
  });

  function create(): ReturnType<typeof TestBed.createComponent<AffiliateCTAComponent>> {
    return TestBed.createComponent(AffiliateCTAComponent);
  }

  it('renders a sponsored offer as an external link with hardened rel and a sponsored badge', () => {
    const fixture = create();
    fixture.componentRef.setInput('offer', SPONSORED_OFFER);
    fixture.detectChanges();

    const link = fixture.debugElement.query(By.css('a'));
    expect(link.nativeElement.getAttribute('href')).toBe(SPONSORED_OFFER.outbound.path);
    expect(link.nativeElement.getAttribute('target')).toBe('_blank');
    expect(link.nativeElement.getAttribute('rel')).toBe('sponsored noopener noreferrer');
    expect(link.nativeElement.textContent).toContain('Ver oferta');
    expect(link.nativeElement.textContent).toContain('Patrocinado');
  });

  it('omits the sponsored badge and uses plain rel for a direct (non-affiliate) offer', () => {
    const fixture = create();
    fixture.componentRef.setInput('offer', DIRECT_OFFER);
    fixture.detectChanges();

    const link = fixture.debugElement.query(By.css('a'));
    expect(link.nativeElement.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.nativeElement.textContent).not.toContain('Patrocinado');
  });

  it('renders a disabled, non-navigating button while loading', () => {
    const fixture = create();
    fixture.componentRef.setInput('offer', SPONSORED_OFFER);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('a'))).toBeNull();
    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.disabled).toBeTrue();
    expect(button.nativeElement.getAttribute('aria-busy')).toBe('true');
  });

  it('renders a disabled fallback button instead of a dead link when there is no offer', () => {
    const fixture = create();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('a'))).toBeNull();
    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.disabled).toBeTrue();
    expect(button.nativeElement.textContent).toContain('No disponible');
  });

  it('emits activated with the offer on click', () => {
    const fixture = create();
    fixture.componentRef.setInput('offer', SPONSORED_OFFER);
    fixture.detectChanges();

    const emitted: (AffiliateResolvedOffer | null)[] = [];
    fixture.componentInstance.activated.subscribe((offer) => emitted.push(offer));

    fixture.debugElement.query(By.css('a')).triggerEventHandler('click', new MouseEvent('click'));

    expect(emitted).toEqual([SPONSORED_OFFER]);
  });

  it('drops target/rel when external is false', () => {
    const fixture = create();
    fixture.componentRef.setInput('offer', SPONSORED_OFFER);
    fixture.componentRef.setInput('external', false);
    fixture.detectChanges();

    const link = fixture.debugElement.query(By.css('a'));
    expect(link.nativeElement.getAttribute('target')).toBeNull();
    expect(link.nativeElement.getAttribute('rel')).toBeNull();
  });
});
