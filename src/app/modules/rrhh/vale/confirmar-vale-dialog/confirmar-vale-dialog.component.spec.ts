import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Subject, of } from 'rxjs';

import { MainService } from '../../../../main.service';
import { CajaVirtual } from '../../caja-virtual/caja-virtual.model';
import { CajaVirtualService } from '../../caja-virtual/caja-virtual.service';
import { Vale } from '../vale.model';
import { ValeService } from '../vale.service';
import { ConfirmarValeDialogComponent } from './confirmar-vale-dialog.component';

function caja(id: number, nombre: string, tipo: string): CajaVirtual {
  const c = new CajaVirtual();
  c.id = id;
  c.nombre = nombre;
  (c as any).tipo = tipo;
  return c;
}

describe('ConfirmarValeDialogComponent', () => {

  let fixture: ComponentFixture<ConfirmarValeDialogComponent>;
  let component: ConfirmarValeDialogComponent;

  function montar(activas$, puedeAprobar = true) {
    TestBed.configureTestingModule({
      declarations: [ConfirmarValeDialogComponent],
      imports: [ReactiveFormsModule, NoopAnimationsModule, MatFormFieldModule, MatSelectModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { vale: new Vale() } },
        { provide: MatDialogRef, useValue: { close: () => { } } },
        { provide: ValeService, useValue: { onConfirmar: () => of(null) } },
        { provide: CajaVirtualService, useValue: { onGetActivas: () => activas$ } },
        { provide: MainService, useValue: { tieneAlgunRol: () => puedeAprobar, usuarioActual: { id: 1 } } }
      ]
    });
    fixture = TestBed.createComponent(ConfirmarValeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  const texto = () => fixture.nativeElement.querySelector('.sin-cajas')?.textContent?.trim();
  const botonConfirmar = () =>
    Array.from(fixture.nativeElement.querySelectorAll('button'))
      .find((b: any) => b.textContent.includes('Confirmar')) as HTMLButtonElement | undefined;

  it('no muestra el cartel mientras la consulta de cajas no responde', () => {
    montar(new Subject<CajaVirtual[]>()); // nunca emite
    expect(component.cargandoCajas).toBeTrue();
    expect(texto()).toBeUndefined();
  });

  it('avisa cuando no hay cajas mayores activas y bloquea el boton', () => {
    montar(of([caja(1, 'CAJA CHICA', 'CAJA_CHICA')])); // ninguna CAJA_MAYOR
    fixture.detectChanges();
    expect(component.cargandoCajas).toBeFalse();
    expect(component.cajas.length).toBe(0);
    expect(texto()).toContain('No hay cajas mayores activas');
    expect(botonConfirmar()?.disabled).toBeTrue();
  });

  it('avisa tambien cuando la consulta falla y devuelve null', () => {
    montar(of(null));
    fixture.detectChanges();
    expect(component.cargandoCajas).toBeFalse();
    expect(texto()).toContain('No hay cajas mayores activas');
  });

  it('con cajas mayores activas no muestra el cartel', () => {
    montar(of([caja(1, 'CAJA MAYOR HQ', 'CAJA_MAYOR'), caja(2, 'CAJA CHICA', 'CAJA_CHICA')]));
    fixture.detectChanges();
    expect(component.cajas.length).toBe(1);
    expect(texto()).toBeUndefined();
  });

  it('oculta el boton Confirmar si el usuario no tiene RRHH APROBAR', () => {
    montar(of([caja(1, 'CAJA MAYOR HQ', 'CAJA_MAYOR')]), false);
    fixture.detectChanges();
    expect(component.puedeAprobar).toBeFalse();
    expect(botonConfirmar()).toBeUndefined();
  });
});
