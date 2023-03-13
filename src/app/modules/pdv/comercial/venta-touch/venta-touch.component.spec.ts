import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VentaTouchComponent } from './venta-touch.component';

describe('VentaTouchComponent', () => {
  let component: VentaTouchComponent;
  let fixture: ComponentFixture<VentaTouchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VentaTouchComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VentaTouchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
