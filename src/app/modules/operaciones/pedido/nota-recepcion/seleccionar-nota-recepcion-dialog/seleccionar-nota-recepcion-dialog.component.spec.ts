import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeleccionarNotaRecepcionDialogComponent } from './seleccionar-nota-recepcion-dialog.component';

describe('SeleccionarNotaRecepcionDialogComponent', () => {
  let component: SeleccionarNotaRecepcionDialogComponent;
  let fixture: ComponentFixture<SeleccionarNotaRecepcionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SeleccionarNotaRecepcionDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SeleccionarNotaRecepcionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
