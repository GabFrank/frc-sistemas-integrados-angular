import { of } from 'rxjs';
import { QrLectorDialogComponent } from './qr-lector-dialog.component';
import { QrLectorService } from '../qr-lector.service';
import { Retiro } from '../../../modules/financiero/retiro/retiro.model';

/**
 * Carrito de escaneo con los QR de los tickets de retiro y de cierre (filial QrTicket).
 * Sin TestBed: el componente se arma con dobles de sus servicios.
 */
describe('QrLectorDialogComponent — retiros por caja', () => {
  const QR_RETIRO = 'frc-24-RETIRO-1151-24-IngresarRetiroCajaMayor-662-null';
  const QR_CIERRE = 'frc-24-PDVCAJA-662-24-IngresarRetiroCajaMayor-null-null';

  /** Lo que devuelve filterRetiros: sin detalle por moneda. */
  const filtrado = { id: 1151, sucursalId: 24, cajaSalida: { id: 662 }, retiroGs: 200000 } as any as Retiro;
  /** Lo que devuelve la lista de pendientes de la caja: con detalle. */
  const pendiente = (id: number) => ({
    id, sucursalId: 24, cajaSalida: { id: 662 }, retiroGs: 100000 * id, retiroRs: 10,
    retiroDetalleList: [{ cantidad: 100000 * id, moneda: { id: 1 } }],
  }) as any as Retiro;

  let retiroService: any;
  let dialogos: any;
  let comp: QrLectorDialogComponent;

  function armar(pendientes: Retiro[], respuesta: boolean = true) {
    retiroService = {
      onFilterRetiro: jasmine.createSpy('onFilterRetiro').and.returnValue(of({ getContent: [filtrado] })),
      onGetPendientesDeCaja: jasmine.createSpy('onGetPendientesDeCaja').and.returnValue(of(pendientes)),
    };
    dialogos = { confirm: jasmine.createSpy('confirm').and.returnValue(of(respuesta)) };
    const mainService: any = { tieneAlgunRol: () => false };
    const beep: any = { beep: () => {}, boop: () => {} };
    comp = new QrLectorDialogComponent(
      { cajaVirtual: { id: 3 } as any }, { close: () => {} } as any, new QrLectorService(), beep,
      retiroService, dialogos, mainService);
  }

  it('el retiro escaneado entra con su detalle por moneda (antes llegaba vacío)', () => {
    armar([pendiente(1151)]);
    comp.onEnter(QR_RETIRO);
    expect(comp.items.length).toBe(1);
    expect(comp.items[0].documento.retiroDetalleList.length).toBeGreaterThan(0);
    expect(comp.items[0].montos).toContain('R$');
    expect(retiroService.onGetPendientesDeCaja).toHaveBeenCalledWith(24, 662, undefined);
    expect(dialogos.confirm).not.toHaveBeenCalled();
  });

  it('con otros pendientes en la caja pregunta y, con Sí, los suma', () => {
    armar([pendiente(1151), pendiente(1152), pendiente(1153)], true);
    comp.onEnter(QR_RETIRO);
    expect(dialogos.confirm).toHaveBeenCalledTimes(1);
    expect(comp.items.map(i => i.id)).toEqual([1151, 1152, 1153]);
  });

  it('con No suma solo el escaneado', () => {
    armar([pendiente(1151), pendiente(1152)], false);
    comp.onEnter(QR_RETIRO);
    expect(comp.items.map(i => i.id)).toEqual([1151]);
  });

  it('el ticket de cierre trae todos los pendientes sin preguntar', () => {
    armar([pendiente(1151), pendiente(1152)]);
    comp.onEnter(QR_CIERRE);
    expect(dialogos.confirm).not.toHaveBeenCalled();
    expect(comp.items.map(i => i.id)).toEqual([1151, 1152]);
  });

  it('el cierre de una caja sin pendientes se rechaza', () => {
    armar([]);
    comp.onEnter(QR_CIERRE);
    expect(comp.items.length).toBe(0);
    expect(comp.rechazos[0].motivo).toContain('no tiene retiros pendientes');
  });

  it('un retiro que no está entre los pendientes de la caja se rechaza', () => {
    armar([pendiente(1152)]);
    comp.onEnter(QR_RETIRO);
    expect(comp.items.length).toBe(0);
    expect(comp.rechazos[0].motivo).toContain('no corresponde a esta caja mayor');
  });

  it('el cierre después del retiro no duplica', () => {
    armar([pendiente(1151), pendiente(1152)], false);
    comp.onEnter(QR_RETIRO);
    comp.onEnter(QR_CIERRE);
    expect(comp.items.map(i => i.id)).toEqual([1151, 1152]);
  });

  it('con teclado en español el lector manda «\'» por «-» y se lee igual', () => {
    armar([pendiente(1151)]);
    comp.lectorTeclado = { alternativa: () => QR_RETIRO } as any;
    comp.onEnter(QR_RETIRO.replace(/-/g, '\''));
    expect(comp.items.map(i => i.id)).toEqual([1151]);
  });
});
