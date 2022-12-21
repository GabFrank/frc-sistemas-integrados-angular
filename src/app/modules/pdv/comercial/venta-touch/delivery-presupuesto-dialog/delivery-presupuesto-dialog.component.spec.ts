import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryPresupuestoDialogComponent } from './delivery-presupuesto-dialog.component';

describe('DeliveryPresupuestoDialogComponent', () => {
  let component: DeliveryPresupuestoDialogComponent;
  let fixture: ComponentFixture<DeliveryPresupuestoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeliveryPresupuestoDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeliveryPresupuestoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
