import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VentaObservacionDashboardComponent } from './venta-observacion-dashboard.component';

describe('VentaObservacionDashboardComponent', () => {
  let component: VentaObservacionDashboardComponent;
  let fixture: ComponentFixture<VentaObservacionDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VentaObservacionDashboardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VentaObservacionDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
