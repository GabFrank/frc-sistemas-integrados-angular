import { fakeAsync, tick } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { RECARGA_TRAS_CORTE_MS } from '../../../../commons/core/utils/graphqlErrorUtils';
import { ChequesDashboardComponent } from './cheques-dashboard.component';

/** #809: un pago hecho solo con cheques diferidos se anula desde el cheque, con el flujo de la caja y el banco. */
describe('ChequesDashboardComponent — anular el pago desde el cheque (#809)', () => {
  let anulacion: any, dialog: any, avisos: any[], motivoPago: string | null;
  let c: ChequesDashboardComponent;
  const FILA: any = { id: 43, numero: 700027, pagoId: 39, estado: 'DIFERIDO' };
  const CHEQUES = [{ id: 43 }, { id: 44 }, { id: 45 }];
  const MOTIVO_CHEQUE = { motivo: 'EFECTIVIZACION', observacion: null };

  beforeEach(() => {
    avisos = [];
    motivoPago = 'PAGO DUPLICADO';
    anulacion = {
      detallePago: jasmine.createSpy('detallePago').and.returnValue(of([{ tipo: 'COMPRA', descripcion: 'COMPRA #12', solicitudPagoId: 12 }])),
      motivoParaChequesDe: jasmine.createSpy('motivoParaChequesDe').and.returnValue(of({ anulacion: MOTIVO_CHEQUE, cheques: CHEQUES })),
      anularPago: jasmine.createSpy('anularPago').and.returnValue(of({ id: 39 })),
      imprimirComprobantes: jasmine.createSpy('imprimirComprobantes'),
    };
    dialog = { open: jasmine.createSpy('open').and.callFake(() => ({ afterClosed: () => of(motivoPago) })) };
    c = new ChequesDashboardComponent(null as any, anulacion, null as any,
      { notification$: { next: (a: any) => avisos.push(a) } } as any, dialog, null as any, null as any, null as any);
    c.puedeAnularPago = true;
    spyOn(c, 'recargar');
  });

  it('anula el pago con el motivo del pago y el de la lista para sus cheques, e imprime sus comprobantes', () => {
    c.onAnularPago(FILA);

    expect(anulacion.motivoParaChequesDe).toHaveBeenCalledOnceWith({ pagoId: 39 }, jasmine.any(String));
    expect(anulacion.anularPago).toHaveBeenCalledOnceWith(39, 'PAGO DUPLICADO', MOTIVO_CHEQUE);
    expect(anulacion.imprimirComprobantes).toHaveBeenCalledOnceWith(CHEQUES);
    expect(avisos[0].texto).toBe('Pago #39 anulado');
    expect(c.recargar).toHaveBeenCalled();
  });

  it('el aviso nombra lo que se reabre', () => {
    c.onAnularPago(FILA);
    expect(dialog.open.calls.mostRecent().args[1].data.detalle).toContain('COMPRA #12');
  });

  it('«Volver» en el motivo del pago no anula y libera el pago', () => {
    motivoPago = null;
    c.onAnularPago(FILA);
    expect(anulacion.motivoParaChequesDe).not.toHaveBeenCalled();
    expect(anulacion.anularPago).not.toHaveBeenCalled();

    motivoPago = 'OTRA VEZ';
    c.onAnularPago(FILA);
    expect(anulacion.anularPago).toHaveBeenCalledTimes(1);
  });

  it('«Volver» en el motivo del cheque (o no poder leerlos) no anula', () => {
    anulacion.motivoParaChequesDe.and.returnValue(of(null));
    c.onAnularPago(FILA);
    expect(anulacion.anularPago).not.toHaveBeenCalled();
    expect(anulacion.imprimirComprobantes).not.toHaveBeenCalled();
  });

  it('otra fila del mismo pago no abre otra anulación mientras corre', () => {
    anulacion.anularPago.and.returnValue(new Subject());
    c.onAnularPago(FILA);
    c.onAnularPago({ ...FILA, id: 44 });
    expect(anulacion.detallePago).toHaveBeenCalledTimes(1);
    expect(anulacion.anularPago).toHaveBeenCalledTimes(1);
  });

  it('un rechazo del central muestra su mensaje y relee', () => {
    anulacion.anularPago.and.returnValue(throwError(() => Object.assign(new Error('El pago ya está anulado'),
      { graphQLErrors: [{ message: 'El pago ya está anulado' }] })));
    c.onAnularPago(FILA);
    expect(avisos.map(a => a.texto)).toEqual(['El pago ya está anulado']);
    expect(anulacion.imprimirComprobantes).not.toHaveBeenCalled();
    expect(c.recargar).toHaveBeenCalled();
  });

  it('sin respuesta espera antes de releer, con el pago bloqueado', fakeAsync(() => {
    const corte: any = new Error('El servidor no respondió a tiempo');
    corte.esTimeout = true;
    anulacion.anularPago.and.returnValue(throwError(() => corte));
    c.onAnularPago(FILA);

    expect(c.recargar).not.toHaveBeenCalled();
    c.onAnularPago(FILA);
    expect(anulacion.anularPago).toHaveBeenCalledTimes(1);
    tick(RECARGA_TRAS_CORTE_MS);
    expect(c.recargar).toHaveBeenCalled();
  }));

  it('la fila ofrece «Anular el pago» solo con permiso, a un cheque de pago no anulado', () => {
    const fila = (x: any) => (c as any).toRow(x);
    expect(fila(FILA)._anularPago).toBeTrue();
    expect(fila(FILA)._motivoNoAnulable).toBeNull();
    expect(fila({ ...FILA, estado: 'COBRADO' })._anularPago).toBeTrue();
    expect(fila({ ...FILA, estado: 'ANULADO' })._anularPago).toBeFalse();
    expect(fila({ ...FILA, pagoId: null })._anularPago).toBeFalse();

    c.puedeAnularPago = false;
    expect(fila(FILA)._anularPago).toBeFalse();
    expect(fila(FILA)._motivoNoAnulable).toContain('pago #39');
  });

  it('si el pago es de RRHH avisa que la liquidación queda aprobada', () => {
    const aviso = (c as any).avisoAnularPago([{ tipo: 'RRHH', descripcion: 'LIQUIDACION #530' }]);
    expect(aviso).toContain('LIQUIDACION #530');
    expect(aviso).toContain('desde RRHH');
    expect((c as any).avisoAnularPago(null)).toContain('vuelven a quedar pendientes');
  });
});
