import { of, throwError } from 'rxjs';
import { ListVentaComponent } from './list-venta.component';

/** Lotes de una venta (#429 fase 2, entrega 2): sin TestBed, sobre los métodos del componente. */
describe('ListVentaComponent - lotes de la venta', () => {
  const proto: any = ListVentaComponent.prototype;

  function ctx(extra: any = {}): any {
    return Object.assign(Object.create(proto), { lotesPorItem: {}, lotesCargadosDe: null, puedeVerLotes: true, selectedCaja: { sucursalId: 2 } }, extra);
  }

  it('un lote: número y vencimiento, sin unidades', () => {
    const c = ctx({ lotesPorItem: { '7': [{ ventaItemId: 7, loteId: 1, numeroLote: 'L2610A', fechaVencimiento: '2027-06-30', cantidad: 2 }] } });
    expect(proto.textoLotes.call(c, 7)).toBe('Lote L2610A · Vto 30/06/27');
  });

  it('varios lotes: cada uno con sus unidades, SIN LOTE y anulado', () => {
    const c = ctx({ lotesPorItem: { '7': [
      { ventaItemId: 7, loteId: 1, numeroLote: 'A', fechaVencimiento: '2027-01-15', cantidad: 3 },
      { ventaItemId: 7, loteId: null, numeroLote: 'SIN LOTE', cantidad: 1, anulado: true }
    ] } });
    expect(proto.textoLotes.call(c, 7)).toBe('Lote A · Vto 15/01/27 (3 u.) · SIN LOTE (1 u.) (anulado)');
  });

  it('ítem sin filas: no muestra nada', () => {
    expect(proto.textoLotes.call(ctx(), 9)).toBeNull();
  });

  it('carga y agrupa por ítem', () => {
    const svc = { onLotesDeVenta: jasmine.createSpy().and.returnValue(of([
      { ventaItemId: 7, loteId: 1, numeroLote: 'A', cantidad: 1 },
      { ventaItemId: 7, loteId: 2, numeroLote: 'B', cantidad: 1 },
      { ventaItemId: 8, loteId: 1, numeroLote: 'A', cantidad: 1 }
    ])) };
    const c = ctx({ loteService: svc });
    proto.cargarLotesDeVenta.call(c, { id: 50, sucursalId: 3 });
    expect(svc.onLotesDeVenta).toHaveBeenCalledWith(50, 3);
    expect(c.lotesPorItem['7'].length).toBe(2);
    expect(c.lotesPorItem['8'].length).toBe(1);
  });

  it('central viejo (error): no rompe y no muestra lotes', () => {
    const svc = { onLotesDeVenta: jasmine.createSpy().and.returnValue(throwError(() => ({ message: 'FieldUndefined' }))) };
    const c = ctx({ loteService: svc });
    proto.cargarLotesDeVenta.call(c, { id: 50 });
    expect(svc.onLotesDeVenta).toHaveBeenCalledWith(50, 2);
    expect(c.lotesPorItem).toEqual({});
  });

  it('sin permiso no consulta', () => {
    const svc = { onLotesDeVenta: jasmine.createSpy() };
    proto.cargarLotesDeVenta.call(ctx({ loteService: svc, puedeVerLotes: false }), { id: 50, sucursalId: 3 });
    expect(svc.onLotesDeVenta).not.toHaveBeenCalled();
  });
});
