import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Subject, of } from 'rxjs';
import { WhereToWatchAffiliateListComponent } from './where-to-watch-affiliate-list.component';
import { AffiliateService } from '../../services/affiliate.service';
import { AffiliateCTAComponent } from '../affiliate-cta/affiliate-cta.component';
import { AffiliateDisclosureComponent } from '../affiliate-disclosure/affiliate-disclosure.component';
import { AffiliateResolvedOffer } from '../../interfaces/affiliate.interface';

function offer(id: string, sponsored: boolean): AffiliateResolvedOffer {
  return {
    offerId: id,
    merchant: { id, slug: id, name: id },
    category: 'streaming',
    plan: { id: 'p', name: 'Plan' },
    display: { disclosure: '' },
    cta: { label: 'Ver', sponsored },
    outbound: { path: `/v2/affiliate/go/${id}` },
  };
}

describe('WhereToWatchAffiliateListComponent', () => {
  function create(resolveMany: jasmine.Spy) {
    TestBed.configureTestingModule({
      imports: [WhereToWatchAffiliateListComponent],
      providers: [
        {
          provide: AffiliateService,
          // trackImpressions is a no-op here: the viewability directive under test
          // is AffiliateImpressionDirective's own spec, not this component's.
          useValue: { resolveMany, buildOutboundUrl: (o: AffiliateResolvedOffer) => o.outbound.path, trackImpressions: () => {} },
        },
      ],
    });
    return TestBed.createComponent(WhereToWatchAffiliateListComponent);
  }

  it('shows the skeleton while the resolve request is pending', () => {
    const pending = new Subject<AffiliateResolvedOffer[]>();
    const fixture = create(jasmine.createSpy().and.returnValue(pending));
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('.wta-list__skeleton')).length).toBeGreaterThan(0);
    expect(fixture.debugElement.query(By.directive(AffiliateCTAComponent))).toBeNull();
  });

  it('renders one AffiliateCTAComponent per resolved offer, as the secondary variant', () => {
    const resolveMany = jasmine.createSpy().and.returnValue(of([offer('a', false), offer('b', false)]));
    const fixture = create(resolveMany);
    fixture.detectChanges();

    const ctas = fixture.debugElement.queryAll(By.directive(AffiliateCTAComponent));
    expect(ctas.length).toBe(2);
    expect(ctas[0].componentInstance.variant()).toBe('secondary');
  });

  it('renders nothing (no error banner, no empty state) when there are no offers', () => {
    const resolveMany = jasmine.createSpy().and.returnValue(of([]));
    const fixture = create(resolveMany);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('section'))).toBeNull();
  });

  it('shows the disclosure when any offer is sponsored', () => {
    const sponsoredSpy = jasmine.createSpy().and.returnValue(of([offer('a', true), offer('b', false)]));
    const sponsoredFixture = create(sponsoredSpy);
    sponsoredFixture.detectChanges();
    expect(sponsoredFixture.debugElement.query(By.directive(AffiliateDisclosureComponent))).not.toBeNull();
  });

  it('omits the disclosure when no offer is sponsored', () => {
    const directSpy = jasmine.createSpy().and.returnValue(of([offer('a', false)]));
    const directFixture = create(directSpy);
    directFixture.detectChanges();
    expect(directFixture.debugElement.query(By.directive(AffiliateDisclosureComponent))).toBeNull();
  });

  it('re-resolves when the content reference changes', () => {
    const resolveMany = jasmine
      .createSpy()
      .and.callFake((context: { contentId?: string }) => of([offer(context.contentId ?? 'none', false)]));
    const fixture = create(resolveMany);

    fixture.componentRef.setInput('contentId', 'movie-1');
    fixture.detectChanges();
    expect(fixture.componentInstance.offers()[0].offerId).toBe('movie-1');

    fixture.componentRef.setInput('contentId', 'movie-2');
    fixture.detectChanges();
    expect(fixture.componentInstance.offers()[0].offerId).toBe('movie-2');
  });
});
