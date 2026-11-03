import { of, throwError } from 'rxjs';
import { VerificarRetiroDialogComponent } from './verificar-retiro-dialog.component';
import { Retiro } from '../../retiro.model';

/**
 * Verificación de retiros apilados de una misma caja: se confirman de a uno y, ante una falla, se
 * reconcilia contra los pendientes del central. Sin TestBed: dobles de los servicios y de los bloques.
 */
describe('VerificarRetiroDialogComponent — retiros apilados', () => {
  const retiro = (id: number) => ({ id, sucursalId: 24, cajaSalida: { id: 662 } }) as any as Retiro;
  const bloque = (r: Retiro, motivo: string = null) => ({
    retiro: r, hayDiferencia: false, observacion: '',
    motivoParaNoConfirmar: () => motivo, conteos: () => [], esRapida: () => true, resumenDiferencias: () => '',
  });

  let verificacion: any;
  let retiroService: any;
  let dialogRef: any;
  let notificacion: any;
  let comp: VerificarRetiroDialogComponent;

  function armar(retiros: Retiro[], motivos: string[] = []) {
    verificacion = {
      onVerificar: jasmine.createSpy('onVerificar').and.returnValue(of({ id: 1 })),
      borrarBorrador: jasmine.createSpy('borrarBorrador'),
    };
    retiroService = { onGetPendientesDeCaja: jasmine.createSpy('onGetPendientesDeCaja') };
    dialogRef = { close: jasmine.createSpy('close') };
    notificacion = { notification$: { next: jasmine.createSpy('next') } };
    comp = new VerificarRetiroDialogComponent(
      { retiros, cajaVirtual: { id: 3, nombre: 'CAJA MAYOR' } as any }, dialogRef, verificacion, retiroService,
      { confirm: () => of(true) } as any, notificacion, { tieneAlgunRol: () => false } as any);
    const bloques = retiros.map((r, i) => bloque(r, motivos[i] || null));
    comp.bloques = { toArray: () => bloques } as any;
  }

  it('confirma todos de a uno y cierra con los que entraron', () => {
    armar([retiro(1), retiro(2), retiro(3)]);
    comp.onConfirmar();
    expect(verificacion.onVerificar).toHaveBeenCalledTimes(3);
    expect(verificacion.borrarBorrador).toHaveBeenCalledTimes(3);
    const res = dialogRef.close.calls.mostRecent().args[0];
    expect(res.ingresados.map(r => r.id)).toEqual([1, 2, 3]);
    expect(res.fuera).toEqual([]);
  });

  it('si falla el 2.º: el 1.º sale con su borrador borrado y el 3.º no se envía', () => {
    armar([retiro(1), retiro(2), retiro(3)]);
    verificacion.onVerificar.and.callFake((id: number) => id === 2 ? throwError(() => new Error('rechazado')) : of({ id }));
    retiroService.onGetPendientesDeCaja.and.returnValue(of([retiro(2), retiro(3)]));
    comp.onConfirmar();
    expect(verificacion.onVerificar).toHaveBeenCalledTimes(2);
    expect(verificacion.borrarBorrador).toHaveBeenCalledWith(1, 24);
    expect(comp.retiros.map(r => r.id)).toEqual([2, 3]);
    expect(comp.titulo).toBe('Verificar 2 retiros de la caja 662');
    expect(comp.guardando).toBeFalse();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('red caída después del commit: el que «falló» pero ya no está pendiente sale igual', () => {
    armar([retiro(1), retiro(2), retiro(3)]);
    verificacion.onVerificar.and.callFake((id: number) => id === 2 ? throwError(() => new Error('timeout')) : of({ id }));
    retiroService.onGetPendientesDeCaja.and.returnValue(of([retiro(3)]));
    comp.onConfirmar();
    expect(verificacion.borrarBorrador).toHaveBeenCalledWith(2, 24);
    expect(comp.retiros.map(r => r.id)).toEqual([3]);
    // El 2 no se cuenta como ingresado con respuesta: se informa aparte al cerrar.
    comp.onCancelar();
    const res = dialogRef.close.calls.mostRecent().args[0];
    expect(res.ingresados.map(r => r.id)).toEqual([1]);
    expect(res.fuera.map(r => r.id)).toEqual([2]);
  });

  it('si tampoco se puede reconsultar, no deja reintentar', () => {
    armar([retiro(1), retiro(2)]);
    verificacion.onVerificar.and.returnValue(throwError(() => new Error('red')));
    retiroService.onGetPendientesDeCaja.and.returnValue(throwError(() => new Error('red')));
    comp.onConfirmar();
    expect(comp.sinConfirmar).toBeTrue();
    verificacion.onVerificar.calls.reset();
    comp.onConfirmar();
    expect(verificacion.onVerificar).not.toHaveBeenCalled();
  });

  it('un bloque sin lo declarado frena todo antes de enviar', () => {
    armar([retiro(1), retiro(2)], [null, 'No se pudo leer lo declarado del retiro #2']);
    comp.onConfirmar();
    expect(verificacion.onVerificar).not.toHaveBeenCalled();
  });
});
