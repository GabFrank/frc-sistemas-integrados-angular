import { of, throwError } from 'rxjs';
import { BuscarLoteComponent } from './buscar-lote.component';
import { ROLES } from '../../../personas/roles/roles.enum';
import { ResultadoBusquedaLote, TrazabilidadProducto } from '../lote.model';

describe('BuscarLoteComponent', () => {
  function crear(roles: string[], buscar: any = of(null)) {
    const loteService: any = {
      onBuscarLotePorNumero: jasmine.createSpy('buscar').and.returnValue(buscar),
      onStockLotePorSucursal: jasmine.createSpy('suc').and.returnValue(of([
        { sucursalId: 1, sucursalNombre: 'CENTRAL', cantidadDisponible: 5 },
        { sucursalId: 2, sucursalNombre: 'SUC II', cantidadDisponible: 0 }
      ]))
    };
    const mainService: any = { usuarioActual: { roles } };
    const tabService: any = { addTab: jasmine.createSpy('addTab') };
    const cdr: any = { markForCheck: () => {} };
    const c = new BuscarLoteComponent(loteService, mainService, tabService, {} as any, cdr);
    c.ngOnInit();
    return { c, loteService, tabService };
  }

  const traz = (p: Partial<TrazabilidadProducto>): TrazabilidadProducto =>
    ({ productoId: 1, entradasSinLote: [], comprasAnteriores: 0, todasLasEntradasConLote: false, ...p });

  it('pide ver productos y además análisis de caja o de venta', () => {
    expect(crear([ROLES.VER_PRODUCTOS]).c.puedeVer).toBeFalse();
    expect(crear([ROLES.ANALISIS_DE_CAJA]).c.puedeVer).toBeFalse();
    expect(crear([ROLES.VER_PRODUCTOS, ROLES.ANALISIS_DE_VENTA]).c.puedeVer).toBeTrue();
    expect(crear([ROLES.ADMIN]).c.puedeVer).toBeTrue();
  });

  it('nunca afirma sin trazado y solo da la frase fuerte sin huecos', () => {
    const { c } = crear([ROLES.ADMIN]);
    expect(c.nivelSinRegistro(undefined)).toBe('sin-producto');
    expect(c.nivelSinRegistro(traz({ trazadoDesde: null }))).toBe('producto-sin-control');
    expect(c.nivelSinRegistro(traz({ trazadoDesde: '2026-08-19T10:00:00', comprasAnteriores: 3 }))).toBe('con-huecos');
    expect(c.nivelSinRegistro(traz({ trazadoDesde: '2026-08-19T10:00:00', todasLasEntradasConLote: true }))).toBe('completo');
  });

  it('formatea una fecha sin hora sin correr el día', () => {
    const { c } = crear([ROLES.ADMIN]);
    expect(c.fecha('2027-06-30')).toBe('30/06/2027');
    expect(c.fecha(null)).toBe('-');
  });

  it('busca con el producto elegido y abre el único resultado', () => {
    const res: ResultadoBusquedaLote = {
      numeroBuscado: '3497', encontrado: true, coincidenciaExacta: true,
      lotes: [{ loteId: 9, productoId: 1, productoDescripcion: 'T 36', numeroLote: '03497', saldoTotal: 5, totalVendido: 10, cantidadVentas: 2 }]
    };
    const { c, loteService } = crear([ROLES.ADMIN], of(res));
    c.producto = { id: 1 } as any;
    c.numeroControl.setValue(' 3497 ');
    c.onBuscar();
    expect(loteService.onBuscarLotePorNumero).toHaveBeenCalledWith('3497', 1);
    expect(c.expandido).toBe(9);
    expect(c.sucursalesPorLote[9].length).toBe(1);
  });

  it('con un central viejo avisa que hay que actualizarlo', () => {
    const { c } = crear([ROLES.ADMIN], throwError(() => ({ graphQLErrors: [{ message: "Validation error (FieldUndefined@[data]) : Field 'buscarLotePorNumero' in type 'Query' is undefined" }] })));
    c.numeroControl.setValue('1');
    c.onBuscar();
    expect(c.error).toContain('actualizar el servidor central');
  });

  it('abre el historial del lote en una solapa', () => {
    const { c, tabService } = crear([ROLES.ADMIN]);
    c.onVerHistorial({ loteId: 9, productoId: 1, productoDescripcion: 'T 36', numeroLote: '03497', saldoTotal: 0, totalVendido: 0, cantidadVentas: 0, archivado: true });
    expect(tabService.addTab).toHaveBeenCalled();
  });
});
