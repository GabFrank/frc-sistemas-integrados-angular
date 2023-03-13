import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeleccionarSucursalDialogComponent } from './seleccionar-sucursal-dialog.component';

describe('SeleccionarSucursalDialogComponent', () => {
  let component: SeleccionarSucursalDialogComponent;
  let fixture: ComponentFixture<SeleccionarSucursalDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SeleccionarSucursalDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SeleccionarSucursalDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
