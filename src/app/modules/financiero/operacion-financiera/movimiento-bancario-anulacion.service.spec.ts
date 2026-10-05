import { of, throwError, EMPTY } from 'rxjs';
import { NotificacionColor } from '../../../notificacion-snackbar.service';
import { accionAnularMovimientoBancario } from './movimiento-bancario-anulacion';
import { MovimientoBancarioAnulacionService } from './movimiento-bancario-anulacion.service';

describe('MovimientoBancarioAnulacionService', () => {
  const PERMISOS = { gestionar: true, pagarCpp: true };
  const PAGO: any = { id: 1, anulado: false, origenTipo: 'PAGO_CPP', origenId: 5, pagoId: 5 };
  const OPERACION: any = { id: 2, anulado: false, origenTipo: 'OPERACION_FINANCIERA', origenId: 12, pagoId: null };

  let dialog: any, cargando: any, avisos: any[], pagarCompras: any, operaciones: any;
  let service: MovimientoBancarioAnulacionService;
  let motivo: string | null;

  beforeEach(() => {
    motivo = 'ERROR DE CARGA';
    avisos = [];
    dialog = { open: jasmine.createSpy('open').and.callFake(() => ({ afterClosed: () => of(motivo) })) };
    cargando = {
      openDialog: jasmine.createSpy('openDialog').and.returnValue({ requestId: 42 }),
      closeDialog: jasmine.createSpy('closeDialog'),
    };
    pagarCompras = { onAnularPago: jasmine.createSpy('onAnularPago').and.returnValue(of({ id: 5 })) };
    operaciones = { onAnular: jasmine.createSpy('onAnular').and.returnValue(of({ id: 12 })) };
    service = new MovimientoBancarioAnulacionService(
      dialog, cargando, { notification$: { next: (a: any) => avisos.push(a) } } as any, pagarCompras, operaciones);
  });

  const anular = (mov: any) => {
    const emitidos: boolean[] = [];
    let completo = false;
    service.anular(mov, accionAnularMovimientoBancario(mov, PERMISOS))
      .subscribe({ next: v => emitidos.push(v), complete: () => completo = true });
    return { emitidos, completo: () => completo };
  };

  it('anula el pago por su pagoId, con el motivo, y bloquea la pantalla mientras corre', () => {
    const r = anular(PAGO);
    expect(pagarCompras.onAnularPago).toHaveBeenCalledOnceWith(5, 'ERROR DE CARGA');
    expect(operaciones.onAnular).not.toHaveBeenCalled();
    expect(cargando.openDialog).toHaveBeenCalledTimes(1);
    expect(cargando.closeDialog).toHaveBeenCalledOnceWith(42);
    expect(r.emitidos).toEqual([true]);
    expect(r.completo()).toBeTrue();
    expect(avisos.map(a => a.color)).toEqual([NotificacionColor.success]);
  });

  it('anula el cheque al contado de un pago por el pagoId, no por el origenId', () => {
    anular({ id: 3, anulado: false, origenTipo: 'CHEQUE', origenId: null, pagoId: 9 });
    expect(pagarCompras.onAnularPago).toHaveBeenCalledOnceWith(9, 'ERROR DE CARGA');
  });

  it('anula la operación financiera por su origenId y sin el aviso genérico de guardado', () => {
    const r = anular(OPERACION);
    expect(operaciones.onAnular).toHaveBeenCalledOnceWith(12, 'ERROR DE CARGA', { avisarExito: false });
    expect(pagarCompras.onAnularPago).not.toHaveBeenCalled();
    // onSaveCustom ya abre su propio «Guardando…».
    expect(cargando.openDialog).not.toHaveBeenCalled();
    expect(r.emitidos).toEqual([true]);
    expect(avisos.length).toBe(1);
  });

  it('no llama a nada si el usuario vuelve atrás sin motivo', () => {
    motivo = null;
    const r = anular(PAGO);
    expect(pagarCompras.onAnularPago).not.toHaveBeenCalled();
    expect(r.emitidos).toEqual([false]);
    expect(r.completo()).toBeTrue();
    expect(avisos).toEqual([]);
  });

  it('no abre el diálogo si la acción no está habilitada', () => {
    const r = anular({ id: 4, anulado: false, origenTipo: 'ACREDITACION_POS', origenId: 3, pagoId: null });
    expect(dialog.open).not.toHaveBeenCalled();
    expect(r.emitidos).toEqual([false]);
  });

  it('avisa una vez el error del pago y cierra el spinner', () => {
    pagarCompras.onAnularPago.and.returnValue(throwError(() => new Error('El pago ya está anulado')));
    const r = anular(PAGO);
    expect(r.emitidos).toEqual([false]);
    expect(r.completo()).toBeTrue();
    expect(avisos.map(a => a.texto)).toEqual(['El pago ya está anulado']);
    expect(cargando.closeDialog).toHaveBeenCalledOnceWith(42);
  });

  it('no repite el timeout del pago, que ya avisó el link de GraphQL', () => {
    const timeout: any = new Error('El servidor no respondió a tiempo');
    timeout.esTimeout = true;
    pagarCompras.onAnularPago.and.returnValue(throwError(() => timeout));
    const r = anular(PAGO);
    expect(r.emitidos).toEqual([false]);
    expect(avisos).toEqual([]);
    expect(cargando.closeDialog).toHaveBeenCalledOnceWith(42);
  });

  it('no muestra el texto crudo de Apollo en un error de red del pago', () => {
    pagarCompras.onAnularPago.and.returnValue(throwError(() => (
      { message: 'Http failure response for http://x/graphql: 0 Unknown Error', networkError: { status: 0 } })));
    anular(PAGO);
    expect(avisos.map(a => a.texto)).toEqual(['Error de red']);
  });

  it('no repite el error de la operación, que ya avisó onSaveCustom', () => {
    operaciones.onAnular.and.returnValue(throwError(() => ({ message: 'Saldo insuficiente en la cuenta bancaria' })));
    const r = anular(OPERACION);
    expect(r.emitidos).toEqual([false]);
    expect(r.completo()).toBeTrue();
    expect(avisos).toEqual([]);
  });

  it('no queda colgado si la mutation completa sin emitir', () => {
    pagarCompras.onAnularPago.and.returnValue(EMPTY);
    const r = anular(PAGO);
    expect(r.emitidos).toEqual([false]);
    expect(r.completo()).toBeTrue();
    expect(cargando.closeDialog).toHaveBeenCalledOnceWith(42);
  });
});
