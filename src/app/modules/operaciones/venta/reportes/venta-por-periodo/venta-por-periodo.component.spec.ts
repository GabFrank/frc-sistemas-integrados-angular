import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VentaPorPeriodoComponent } from './venta-por-periodo.component';

describe('VentaPorPeriodoComponent', () => {
  let component: VentaPorPeriodoComponent;
  let fixture: ComponentFixture<VentaPorPeriodoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VentaPorPeriodoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VentaPorPeriodoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
