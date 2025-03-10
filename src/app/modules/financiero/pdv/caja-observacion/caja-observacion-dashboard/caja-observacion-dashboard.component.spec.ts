import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CajaObservacionDashboardComponent } from './caja-observacion-dashboard.component';

describe('CajaObservacionDashboardComponent', () => {
  let component: CajaObservacionDashboardComponent;
  let fixture: ComponentFixture<CajaObservacionDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CajaObservacionDashboardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CajaObservacionDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
