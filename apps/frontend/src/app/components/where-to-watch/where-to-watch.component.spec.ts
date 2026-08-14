import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { StreamingProvidersService } from '../../services/streaming-providers.service';
import { WhereToWatchComponent } from './where-to-watch.component';

describe('WhereToWatchComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [WhereToWatchComponent],
      providers: [{
        provide: StreamingProvidersService,
        useValue: {
          getProviders: () => of({}),
          getProvidersByTmdb: () => of({}),
          getLocalLogoPath: (name: string) => `/logos/${name}.svg`,
        },
      }],
    });
  });

  it('reacts when providersData changes and deduplicates rent and buy', () => {
    const fixture = TestBed.createComponent(WhereToWatchComponent);
    const component = fixture.componentInstance;
    component.providersData = {
      rent: [{ id: 1, name: 'Prime Video', type: 'rent' }],
      buy: [{ id: 2, name: 'prime video', type: 'buy' }],
    };

    component.ngOnChanges({ providersData: {} as any });

    expect(component.providers).toBe(component.providersData);
    expect(component.paidProviders(component.providers!)).toHaveSize(1);
  });

  it('uses known primary platforms when detailed provider groups are absent', () => {
    const fixture = TestBed.createComponent(WhereToWatchComponent);
    const component = fixture.componentInstance;
    component.primaryPlatforms = ['Netflix', 'Netflix', 'Max'];

    component.ngOnChanges({ primaryPlatforms: {} as any });

    expect(component.providers?.flatrate?.map((provider) => provider.name)).toEqual(['Netflix', 'Max']);
  });
});
