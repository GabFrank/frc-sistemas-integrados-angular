import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddVentaObservacionComponent } from './add-venta-observacion.component';

describe('AddVentaObservacionComponent', () => {
  let component: AddVentaObservacionComponent;
  let fixture: ComponentFixture<AddVentaObservacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddVentaObservacionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddVentaObservacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
