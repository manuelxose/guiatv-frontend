import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CanalCompletoComponent } from './canal-completo.component';

describe('CanalCompletoComponent', () => {
  let component: CanalCompletoComponent;
  let fixture: ComponentFixture<CanalCompletoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CanalCompletoComponent]
    });
    fixture = TestBed.createComponent(CanalCompletoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
