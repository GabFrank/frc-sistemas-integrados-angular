import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeleccionarCajaDialogComponent } from './seleccionar-caja-dialog.component';

describe('SeleccionarCajaDialogComponent', () => {
  let component: SeleccionarCajaDialogComponent;
  let fixture: ComponentFixture<SeleccionarCajaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SeleccionarCajaDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SeleccionarCajaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
