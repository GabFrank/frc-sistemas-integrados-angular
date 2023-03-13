import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryOpcionesDialogComponent } from './delivery-opciones-dialog.component';

describe('DeliveryOpcionesDialogComponent', () => {
  let component: DeliveryOpcionesDialogComponent;
  let fixture: ComponentFixture<DeliveryOpcionesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeliveryOpcionesDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeliveryOpcionesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
