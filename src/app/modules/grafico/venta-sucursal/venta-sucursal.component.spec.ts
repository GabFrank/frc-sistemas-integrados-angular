import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VentaSucursalComponent } from './venta-sucursal.component';

describe('VentaSucursalComponent', () => {
  let component: VentaSucursalComponent;
  let fixture: ComponentFixture<VentaSucursalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VentaSucursalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VentaSucursalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
