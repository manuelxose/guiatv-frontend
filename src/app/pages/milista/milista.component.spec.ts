import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MilistaComponent } from './milista.component';

describe('MilistaComponent', () => {
  let component: MilistaComponent;
  let fixture: ComponentFixture<MilistaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MilistaComponent]
    });
    fixture = TestBed.createComponent(MilistaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
