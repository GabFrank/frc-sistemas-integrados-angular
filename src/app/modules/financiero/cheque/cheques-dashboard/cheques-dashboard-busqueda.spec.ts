import { of } from 'rxjs';
import { MatSort } from '@angular/material/sort';
import { ChequesDashboardComponent } from './cheques-dashboard.component';
import { EstadoCheque } from '../cheque.model';

/** #767: un Nº se busca en todas las fechas y estados; la tabla se ordena por el valor real de cada columna. */
describe('ChequesDashboardComponent — búsqueda por Nº y orden (#767)', () => {
  let cheques: any;
  let numeracion: any;
  let c: ChequesDashboardComponent;

  beforeEach(() => {
    cheques = {
      onGetChequesDashboard: jasmine.createSpy('onGetChequesDashboard').and.returnValue(of([])),
      onGetResumenPorDia: jasmine.createSpy('onGetResumenPorDia').and.returnValue(of([])),
      onGetSaldosPorChequera: jasmine.createSpy('onGetSaldosPorChequera').and.returnValue(of([])),
    };
    numeracion = { onGetInutilizados: jasmine.createSpy('onGetInutilizados').and.returnValue(of([])) };
    c = new ChequesDashboardComponent(cheques, null as any, null as any, { notification$: { next: () => {} } } as any,
      null as any, null as any, null as any, numeracion);
    c.desdeControl.setValue(new Date(2026, 10, 27));
    c.hastaControl.setValue(new Date(2026, 10, 27));
    c.estadoSel = 'COBRADOS';
    c.tipoFechaSel = 'PAGO';
  });

  const lista = () => cheques.onGetChequesDashboard.calls.mostRecent().args[0];
  const resumen = () => cheques.onGetResumenPorDia.calls.mostRecent().args[0];

  it('un Nº consulta todas las fechas y estados, por emisión', () => {
    c.textoControl.setValue(' 303644 ');
    c.recargar();
    expect(c.buscandoNumero).toBeTrue();
    expect(lista()).toEqual(jasmine.objectContaining({
      desde: '2000-01-01 00:00', hasta: '2100-12-31 23:59', tipoFecha: 'EMISION', estados: [],
    }));
    // El KPI suma plata comprometida: sin estado, como «Todos», deja afuera los anulados.
    expect(resumen().estados).toEqual([EstadoCheque.DIFERIDO, EstadoCheque.EMITIDO, EstadoCheque.COBRADO]);
  });

  it('un texto con letras respeta el rango, el estado y el tipo de fecha elegidos', () => {
    c.textoControl.setValue('garcia 12');
    c.recargar();
    expect(c.buscandoNumero).toBeFalse();
    expect(lista()).toEqual(jasmine.objectContaining({
      desde: '2026-11-27 00:00', hasta: '2026-11-27 23:59', tipoFecha: 'PAGO', estados: [EstadoCheque.COBRADO],
    }));
  });

  it('con la vista de inutilizados, un Nº igual busca cheques', () => {
    c.estadoSel = 'INUTILIZADOS';
    c.textoControl.setValue('12');
    c.recargar();
    expect(numeracion.onGetInutilizados).not.toHaveBeenCalled();
    expect(lista().estados).toEqual([]);
  });

  it('un Nº quita el foco de día, que escondería el cheque', () => {
    c.focoDesdeControl.setValue(new Date(2026, 10, 27));
    c.textoControl.setValue('12');
    c.recargar();
    expect(c.focoDesdeControl.value).toBeNull();
  });

  it('ordena número, fecha y monto como números, y nulos sin romper', () => {
    const filas: any[] = [
      { id: 1, numero: 9, total: 100, fechaPago: '2026-12-01T00:00:00', _beneficiario: 'b' },
      { id: 2, numero: 10, total: 2000, fechaPago: '2026-02-01T00:00:00', _beneficiario: 'A' },
      { id: -3, numero: 11, total: null, fechaPago: null, _beneficiario: '' },
    ];
    const sort = new MatSort();
    c.sort = sort;
    c.dataSource.data = filas;
    const orden = (col: string, dir: 'asc' | 'desc') => {
      sort.active = col;
      sort.direction = dir;
      return c.dataSource.sortData(filas.slice(), sort).map(r => r.id);
    };
    expect(orden('numero', 'desc')).toEqual([-3, 2, 1]);          // 11 > 10 > 9, no «9» > «11»
    expect(orden('monto', 'desc')).toEqual([2, 1, -3]);
    expect(orden('fechaPago', 'asc')).toEqual([-3, 2, 1]);
    expect(orden('beneficiario', 'asc')).toEqual([-3, 2, 1]);     // sin distinguir mayúsculas
  });
});
