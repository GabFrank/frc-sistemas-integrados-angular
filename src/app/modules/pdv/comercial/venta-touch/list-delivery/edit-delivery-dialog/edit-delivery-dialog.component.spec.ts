import { of } from 'rxjs';
import { EditDeliveryDialogComponent } from './edit-delivery-dialog.component';
import { CobroDetalle } from '../../../../../operaciones/venta/cobro/cobro-detalle.model';

/**
 * Una línea de cobro sin monto (la X deja null; Backspace deja 0 porque el currencyMask no es nullable) se
 * grababa con valor NULL y trababa el balance de toda la caja (#815, filial #286). Se instancia sin TestBed:
 * el template y los setTimeout del alta no hacen falta para addCobroDetalle.
 */
describe('EditDeliveryDialogComponent: línea de cobro sin monto (#815)', () => {
  const guarani: any = { id: 1, denominacion: 'GUARANI', cambio: 1 };
  const efectivo: any = { id: 1, descripcion: 'EFECTIVO' };
  const convenio: any = { id: 9, descripcion: 'CONVENIO' };
  let ventaService: jasmine.SpyObj<any>;
  let snackbar: jasmine.SpyObj<any>;
  const input = () => ({ nativeElement: { select: () => {}, focus: () => {} } });

  function crear(deliveryId: number = null): EditDeliveryDialogComponent {
    ventaService = jasmine.createSpyObj('VentaService', ['onSaveCobroDetalle']);
    ventaService.onSaveCobroDetalle.and.returnValue(of({ id: 1 }));
    snackbar = jasmine.createSpyObj('NotificacionSnackbarService', ['openWarn']);
    const data: any = { delivery: { id: deliveryId, venta: { valorTotal: 6000, cobro: { id: 79540 } } } };
    const c = new EditDeliveryDialogComponent(data, null, null, null, null, ventaService, snackbar, null, null);
    const x = c as any;
    c.monedaList = [guarani];
    c.formaPagoList = [efectivo];
    c.selectedPrecio = { id: 1, valor: 5000 } as any;
    c.selectedMoneda = guarani;
    c.selectedFormaPago = efectivo;
    c.saldoControl.setValue(11000);
    x.telefonoInput = input();
    x.formaPagoInput = input();
    x.vueltoInput = input();
    spyOn(x, 'onFormaPagoSelect');
    spyOn(x, 'onMonedaSelect');
    return c;
  }

  it('delivery nuevo: con el valor vacío (la X) no agrega la línea y avisa', () => {
    const c = crear();
    c.vueltoControl.setValue(null);
    c.addCobroDetalle();
    expect(c.cobroItemList.length).toBe(0);
    expect(snackbar.openWarn).toHaveBeenCalledWith('Ingresá el valor del cobro.', 3);
    expect(c.vueltoControl.value).toBeNull();
  });

  it('delivery nuevo: con 0 (Backspace) no agrega la línea', () => {
    const c = crear();
    c.vueltoControl.setValue(0);
    c.addCobroDetalle();
    expect(c.cobroItemList.length).toBe(0);
    expect(snackbar.openWarn).toHaveBeenCalled();
  });

  it('delivery guardado: con el valor vacío no manda la línea al filial', () => {
    const c = crear(8068);
    c.vueltoControl.setValue(null);
    c.addCobroDetalle();
    expect(ventaService.onSaveCobroDetalle).not.toHaveBeenCalled();
    expect(c.cobroItemList.length).toBe(0);
  });

  it('con monto se agrega como siempre', () => {
    const c = crear();
    c.vueltoControl.setValue(100000);
    c.addCobroDetalle();
    expect(c.cobroItemList.length).toBe(1);
    expect(c.cobroItemList[0].valor).toBe(100000);
    expect(c.vueltoControl.value).toBe(-89000);
    expect(snackbar.openWarn).not.toHaveBeenCalled();
  });

  it('un vuelto (valor negativo) se agrega como siempre', () => {
    const c = crear();
    c.saldoControl.setValue(-89000);
    c.valorParcialPagado = 100000;
    c.vueltoControl.setValue(-89000);
    c.addCobroDetalle();
    expect(c.cobroItemList.length).toBe(1);
    expect(c.cobroItemList[0].vuelto).toBeTrue();
    expect(snackbar.openWarn).not.toHaveBeenCalled();
  });

  it('con saldo 0 el Enter va al teléfono sin avisar', () => {
    const c = crear();
    c.saldoControl.setValue(0);
    c.vueltoControl.setValue(null);
    const telefono = (c as any).telefonoInput.nativeElement;
    spyOn(telefono, 'select');
    c.addCobroDetalle();
    expect(telefono.select).toHaveBeenCalled();
    expect(snackbar.openWarn).not.toHaveBeenCalled();
    expect(c.cobroItemList.length).toBe(0);
  });

  it('reabrir un delivery muestra igual una línea guardada sin monto', () => {
    const c = crear(8068);
    const guardada = Object.assign(new CobroDetalle(), { id: 297400, valor: null, moneda: guarani, formaPago: efectivo, cambio: 1 });
    c.vueltoControl.setValue(null);
    c.addCobroDetalle(null, guardada);
    expect(c.cobroItemList.length).toBe(1);
    expect(snackbar.openWarn).not.toHaveBeenCalled();
    expect(ventaService.onSaveCobroDetalle).not.toHaveBeenCalled();
  });

  it('con CONVENIO (campo deshabilitado) no avisa ni agrega', () => {
    const c = crear();
    c.selectedFormaPago = convenio;
    c.vueltoControl.setValue(null);
    c.vueltoControl.disable();
    c.addCobroDetalle();
    expect(c.cobroItemList.length).toBe(0);
    expect(snackbar.openWarn).not.toHaveBeenCalled();
  });
});
