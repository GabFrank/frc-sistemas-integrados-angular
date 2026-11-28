import { of } from 'rxjs';
import { ChequesDashboardComponent } from './cheques-dashboard.component';

/** #811: con el rango incompleto el dashboard mandaba `desde`/`hasta` en null y el central rechazaba las tres consultas. */
describe('ChequesDashboardComponent — rango incompleto (#811)', () => {
  let cheques: any;
  let c: ChequesDashboardComponent;

  const D = new Date(2026, 10, 20);
  const H = new Date(2026, 10, 25);
  const ymd = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

  beforeEach(() => {
    cheques = {
      onGetChequesDashboard: jasmine.createSpy('onGetChequesDashboard').and.returnValue(of([])),
      onGetResumenPorDia: jasmine.createSpy('onGetResumenPorDia').and.returnValue(of([])),
      onGetSaldosPorChequera: jasmine.createSpy('onGetSaldosPorChequera').and.returnValue(of([])),
    };
    // Sin ngOnInit (pide roles y recarga con hoy): cada caso arma su rango.
    c = new ChequesDashboardComponent(cheques, null as any, null as any, { notification$: { next: () => {} } } as any,
      null as any, null as any, null as any, null as any);
  });

  const consultado = () => ({
    desde: cheques.onGetChequesDashboard.calls.mostRecent().args[0].desde,
    hasta: cheques.onGetChequesDashboard.calls.mostRecent().args[0].hasta,
    resumen: cheques.onGetResumenPorDia.calls.mostRecent().args[0],
    saldosHasta: cheques.onGetSaldosPorChequera.calls.mostRecent().args[0],
  });

  it('con las dos puntas consulta el rango tal cual', () => {
    c.desdeControl.setValue(D);
    c.hastaControl.setValue(H);
    c.recargar();
    const q = consultado();
    expect(q.desde).toBe(ymd(D) + ' 00:00');
    expect(q.hasta).toBe(ymd(H) + ' 23:59');
    expect(q.saldosHasta).toBe(ymd(H) + ' 23:59');
  });

  it('sin «hasta» consulta el día de «desde» y lo deja en el campo', () => {
    c.desdeControl.setValue(D);
    c.hastaControl.setValue(null);
    c.recargar();
    const q = consultado();
    expect(q.desde).toBe(ymd(D) + ' 00:00');
    expect(q.hasta).toBe(ymd(D) + ' 23:59');
    expect(q.resumen.hasta).toBe(ymd(D) + ' 23:59');
    expect(q.saldosHasta).toBe(ymd(D) + ' 23:59');
    expect(ymd(c.hastaControl.value)).toBe(ymd(D));
  });

  it('sin «desde» consulta el día de «hasta»', () => {
    c.desdeControl.setValue(null);
    c.hastaControl.setValue(H);
    c.recargar();
    const q = consultado();
    expect(q.desde).toBe(ymd(H) + ' 00:00');
    expect(q.hasta).toBe(ymd(H) + ' 23:59');
    expect(ymd(c.desdeControl.value)).toBe(ymd(H));
  });

  it('sin ninguna consulta hoy', () => {
    c.desdeControl.setValue(null);
    c.hastaControl.setValue(null);
    c.recargar();
    const hoy = ymd(new Date());
    expect(consultado().desde).toBe(hoy + ' 00:00');
    expect(consultado().hasta).toBe(hoy + ' 23:59');
  });

  it('con el calendario abierto no escribe en los campos, pero igual manda fechas válidas', () => {
    (c as any).rangoPicker = { opened: true };
    c.desdeControl.setValue(D);
    c.hastaControl.setValue(null);
    c.recargar();
    expect(c.hastaControl.value).toBeNull();
    expect(consultado().hasta).toBe(ymd(D) + ' 23:59');
  });

  it('el «hasta» vaciado al empezar un rango nuevo no dispara consultas', () => {
    c.desdeControl.setValue(D);
    c.hastaControl.setValue(null);
    c.onHastaChange();
    expect(cheques.onGetChequesDashboard).not.toHaveBeenCalled();
    expect(cheques.onGetSaldosPorChequera).not.toHaveBeenCalled();

    c.hastaControl.setValue(H);
    c.onHastaChange();
    expect(cheques.onGetChequesDashboard).toHaveBeenCalledTimes(1);
  });
});
