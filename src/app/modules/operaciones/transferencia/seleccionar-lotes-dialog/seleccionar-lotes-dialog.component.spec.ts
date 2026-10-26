import { FormControl } from '@angular/forms';
import { of } from 'rxjs';

import { EtapaAsignacionLote } from '../transferencia.model';
import { SeleccionarLotesDialogComponent } from './seleccionar-lotes-dialog.component';

/**
 * Reglas de lotes flexibles fase 1 (#429) en el selector de lotes de transferencias. Se prueba la
 * clase sin TestBed: la lógica no depende del template.
 */
describe('SeleccionarLotesDialogComponent (lotes flexibles #429)', () => {
  let component: SeleccionarLotesDialogComponent;
  let dialogRef: { close: jasmine.Spy };
  let notificacion: { openWarn: jasmine.Spy };

  const lote = (loteId: number, numeroLote: string, disponible: number) => ({
    loteId,
    numeroLote,
    estado: 'LIBERADO',
    cantidadDisponiblePresentacion: disponible,
    cantidadDisponible: disponible,
    unidadesPorPresentacion: 1,
    presentacionDescripcion: 'Unidad'
  });

  function crear(cantidad: number, lotes: any[], asignacionActual?: any[]) {
    dialogRef = { close: jasmine.createSpy('close') };
    notificacion = { openWarn: jasmine.createSpy('openWarn') };
    const loteService = {
      onGetStockPorLoteEnPresentacion: () =>
        of({ getContent: lotes, getTotalElements: lotes.length })
    };
    const mainService = { tieneAlgunRol: () => true };
    const cdr = { markForCheck: () => {} };
    component = new SeleccionarLotesDialogComponent(
      {
        productoId: 1,
        productoDescripcion: '1 - T 36',
        sucursalOrigenId: 2,
        sucursalOrigenNombre: 'CENTRAL',
        cantidad,
        etapa: EtapaAsignacionLote.PRE_TRANSFERENCIA,
        presentacionId: 10,
        asignacionActual
      } as any,
      dialogRef as any,
      loteService as any,
      notificacion as any,
      cdr as any,
      mainService as any,
      'es'
    );
    component.ngOnInit();
  }

  function tipear(loteId: number, valor: number) {
    const fila = component.filas.find((f) => f.loteId === loteId);
    fila.control.setValue(valor);
    component.onCantidadCambiada(fila);
  }

  it('deja repartir un ítem entre varios lotes (45 + 4 = 49)', () => {
    crear(49, [lote(1, 'LOTE-A', 45), lote(2, 'LOTE-B', 4)]);
    tipear(1, 45);
    tipear(2, 4);
    expect(component.filas.every((f) => f.control.enabled)).toBeTrue();
    expect(component.totalAsignado).toBe(49);
    component.onConfirmar();
    const res = dialogRef.close.calls.mostRecent().args[0];
    expect(res.lotes).toEqual([
      { loteId: 1, cantidad: 45 },
      { loteId: 2, cantidad: 4 }
    ]);
    expect(res.total).toBe(49);
  });

  it('con menos que la cantidad confirma y el resto queda para FEFO / SIN LOTE', () => {
    crear(80, [lote(1, 'LOTE-A', 45), lote(2, 'LOTE-B', 4)]);
    tipear(1, 45);
    tipear(2, 4);
    expect(component.hayFaltante).toBeTrue();
    expect(component.mensajeFaltante).toContain('SIN LOTE');
    component.onConfirmar();
    expect(dialogRef.close).toHaveBeenCalled();
    expect(dialogRef.close.calls.mostRecent().args[0].total).toBe(49);
  });

  it('pasar el saldo de un lote se permite con aviso', () => {
    crear(10, [lote(1, 'LOTE-A', 4)]);
    tipear(1, 10);
    expect(component.avisoSobreSaldo).toContain('LOTE-A');
    component.onConfirmar();
    expect(notificacion.openWarn).toHaveBeenCalled();
    expect(dialogRef.close.calls.mostRecent().args[0].lotes).toEqual([{ loteId: 1, cantidad: 10 }]);
  });

  it('sigue sin dejar asignar más de lo que se transfiere', () => {
    crear(5, [lote(1, 'LOTE-A', 45), lote(2, 'LOTE-B', 4)]);
    tipear(1, 4);
    tipear(2, 4);
    expect(component.excedeRequerido).toBeTrue();
    component.onConfirmar();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('un lote en 0 se ignora', () => {
    crear(4, [lote(1, 'LOTE-A', 45), lote(2, 'LOTE-B', 4)]);
    tipear(1, 0);
    tipear(2, 4);
    component.onConfirmar();
    expect(dialogRef.close.calls.mostRecent().args[0].lotes).toEqual([{ loteId: 2, cantidad: 4 }]);
  });

  it('precarga todos los lotes ya asignados e ignora las filas SIN LOTE', () => {
    crear(80, [lote(1, 'LOTE-A', 45), lote(2, 'LOTE-B', 4)], [
      { loteId: 1, numeroLote: 'LOTE-A', cantidadPresentacion: 45 },
      { loteId: 2, numeroLote: 'LOTE-B', cantidadPresentacion: 4 },
      { loteId: null, numeroLote: 'SIN LOTE', cantidadPresentacion: 31 }
    ]);
    expect(component.totalAsignado).toBe(49);
    expect(component.filas.find((f) => f.loteId === 1).control.value).toBe(45);
  });

  it('si no se pudo verificar el saldo, no traba: cierra sin cambiar el reparto', () => {
    crear(4, [lote(1, 'LOTE-A', 45)]);
    component.cargaFallo = true;
    component.onConfirmar();
    expect(notificacion.openWarn).toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });

  it('presentaciones completas: no deja fraccionar una caja', () => {
    crear(3, [{ ...lote(1, 'LOTE-A', 10), unidadesPorPresentacion: 12, presentacionDescripcion: 'Caja' }]);
    tipear(1, 1.5);
    component.onConfirmar();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });
  it('no muestra la fila SIN LOTE que devuelve el central (no se puede elegir)', () => {
    crear(10, [lote(1, 'LOTE-A', 45), { ...lote(null, 'SIN LOTE', 31) }]);
    expect(component.filas.length).toBe(1);
    expect(component.filas[0].loteId).toBe(1);
    expect(component.totalElementos).toBe(1);
    expect(component.sinLotes).toBeFalse();
  });

  it('si solo hay SIN LOTE, avisa que no hay stock por lote', () => {
    crear(10, [{ ...lote(null, 'SIN LOTE', 31) }]);
    expect(component.filas.length).toBe(0);
    expect(component.sinLotes).toBeTrue();
  });
});
