import { Subject } from 'rxjs';

import { ListMovimientoStockComponent } from './list-movimiento-stock.component';

// Instancia directa: el constructor pide 13 servicios y la pantalla no se renderiza en estos casos (#581).
describe('ListMovimientoStockComponent', () => {
  let component: ListMovimientoStockComponent;
  let service: jasmine.SpyObj<any>;
  let notificacion: jasmine.SpyObj<any>;
  let respuestaLista: Subject<any>;

  const fechaSola = (d: Date) => d.toDateString();

  beforeEach(() => {
    respuestaLista = new Subject<any>();
    service = jasmine.createSpyObj('MovimientoStockService', [
      'onGetMovimientoStockPorFiltros', 'onGetStockPorProducto', 'onGetStockPorTipoMovimiento',
    ]);
    service.onGetMovimientoStockPorFiltros.and.returnValue(respuestaLista);
    notificacion = jasmine.createSpyObj('NotificacionSnackbarService', ['openWarn']);
    component = new ListMovimientoStockComponent(
      service, null, { innerHeight: 800 } as any, null, null, null, null, null, notificacion,
      null, null, null, null,
    );
    component.fechaInicioControl.setValue(new Date(2026, 0, 1));
    component.fechaFinalControl.setValue(new Date(2026, 0, 31));
    component.sucursalList = [];
  });

  it('pide la primera página con el tamaño que muestra el paginador (15)', () => {
    expect(component.size).toBe(15);
  });

  it('sin producto no consulta la lista y avisa', () => {
    component.onFiltrar();

    expect(service.onGetMovimientoStockPorFiltros).not.toHaveBeenCalled();
    expect(notificacion.openWarn).toHaveBeenCalled();
    expect(component.stockActualEstado).toBe('sin-producto');
    expect(component.dataSource.data).toEqual([]);
  });

  it('Limpiar vuelve los filtros y el resumen al inicio sin consultar', () => {
    component.selectedProducto = { id: 7 } as any;
    component.buscarProductoControl.setValue('7 - COCA');
    component.productoList = [{ id: 7 } as any];
    component.isPesable = true;
    component.selectedUsuario = { id: 3 } as any;
    component.buscarUsuarioControl.setValue('PEPE');
    component.sucursalControl.setValue([{ id: 1 }]);
    component.tipoMovimientoControl.setValue(['VENTA']);
    component.referenciaControl.setValue('X');
    component.horaInicioControl.setValue('08:00');
    component.horaFinalControl.setValue('10:00');
    component.page = 3;
    component.dataSource.data = [{ id: 1 } as any];
    component.selectedPageInfo = {} as any;
    component.stockActualEstado = 'ok';
    component.stockPeriodoEstado = 'no-disponible';
    component.stockTotal = 10;
    component.stockPorRangoFecha = 5;
    component.stockPorTipoMovimiento = [{ tipoMovimiento: 'VENTA', stock: 5 }];
    component.stockActualDesglose = [{ sucursal: 'A', stock: 1 }];
    component.stockPeriodoSinRespuesta = 'A';
    component.desgloseHabilitado = true;

    component.resetFiltro();

    const haceUnaSemana = new Date();
    haceUnaSemana.setDate(haceUnaSemana.getDate() - 7);
    expect(fechaSola(component.fechaInicioControl.value)).toBe(fechaSola(haceUnaSemana));
    expect(fechaSola(component.fechaFinalControl.value)).toBe(fechaSola(new Date()));
    expect(component.fechaInicioControl.value).not.toBe(component.fechaFinalControl.value);
    expect(component.horaInicioControl.value).toBe('00:00');
    expect(component.horaFinalControl.value).toBe('23:59');
    expect(component.selectedProducto).toBeNull();
    expect(component.buscarProductoControl.value).toBeNull();
    expect(component.productoList).toEqual([]);
    expect(component.isPesable).toBeFalse();
    expect(component.selectedUsuario).toBeNull();
    expect(component.buscarUsuarioControl.value).toBeNull();
    expect(component.sucursalControl.value).toBeNull();
    expect(component.tipoMovimientoControl.value).toBeNull();
    expect(component.referenciaControl.value).toBeNull();
    expect(component.page).toBe(0);
    expect(component.dataSource.data).toEqual([]);
    expect(component.selectedPageInfo).toBeNull();
    expect(component.stockActualEstado).toBe('inicial');
    expect(component.stockPeriodoEstado).toBe('inicial');
    expect(component.stockTotal).toBeNull();
    expect(component.stockPorRangoFecha).toBeNull();
    expect(component.stockPorTipoMovimiento).toEqual([]);
    expect(component.stockActualDesglose).toEqual([]);
    expect(component.stockPeriodoSinRespuesta).toBe('');
    expect(component.desgloseHabilitado).toBeFalse();
    expect(service.onGetMovimientoStockPorFiltros).not.toHaveBeenCalled();
    expect(notificacion.openWarn).not.toHaveBeenCalled();
  });

  it('una respuesta que llega después de Limpiar no repinta la tabla', () => {
    component.selectedProducto = { id: 7 } as any;
    component.onFiltrar();
    expect(service.onGetMovimientoStockPorFiltros).toHaveBeenCalled();

    component.resetFiltro();
    respuestaLista.next({ getContent: [{ id: 1 }], getTotalElements: 1 });

    expect(component.dataSource.data).toEqual([]);
    expect(component.selectedPageInfo).toBeNull();
  });

  it('una respuesta que llega después de buscar sin producto no repinta la tabla', () => {
    component.selectedProducto = { id: 7 } as any;
    component.onFiltrar();

    component.selectedProducto = null;
    component.onFiltrar();
    respuestaLista.next({ getContent: [{ id: 1 }], getTotalElements: 1 });

    expect(component.dataSource.data).toEqual([]);
  });
});
