import { of } from 'rxjs';
import { ImpresionService } from './impresion.service';

/** Qué impresora usa el ticket directo (comprobante de cheque anulado, #807). */
describe('ImpresionService.imprimirTicketDirecto', () => {
  let electron: any, impresoras: any, config: any, avisos: any[], generar: jasmine.Spy;
  let service: ImpresionService;

  const REGISTRO = [{ nombre: 'TICKET_SOPORTE', uso: 'TICKET', tipo: 'TERMICA', conexion: 'CUPS', colaCups: 'ticket_soporte',
    anchoMm: 80, esPredeterminada: false }];

  beforeEach(() => {
    avisos = [];
    electron = { isElectron: true, printLocal: jasmine.createSpy('printLocal').and.returnValue(of({ success: true })) };
    impresoras = { todas: jasmine.createSpy('todas').and.returnValue(of(REGISTRO)) };
    config = { getConfig: () => ({ impresoraLocal: { nombre: 'FRC-TICKET', cola: 'FRC-TICKET', conexion: 'USB', perfil: 'MM_58' } }) };
    generar = jasmine.createSpy('generar').and.returnValue(of('ZXNjcG9z'));
    service = new ImpresionService(null as any, null as any, null as any,
      { notification$: { next: (a: any) => avisos.push(a) } } as any, electron, impresoras, config);
  });

  it('usa la impresora configurada en esta PC, con el ancho de su perfil, sin consultar el registro', () => {
    service.imprimirTicketDirecto('Cheque anulado Nº 1', generar);

    expect(impresoras.todas).not.toHaveBeenCalled();
    expect(generar).toHaveBeenCalledOnceWith(58);
    expect(electron.printLocal).toHaveBeenCalledOnceWith(jasmine.objectContaining({ conexion: 'USB', cola: 'FRC-TICKET' }));
    expect(avisos[0].texto).toContain('enviado a FRC-TICKET');
  });

  it('un perfil de 80 mm genera el ticket de 80', () => {
    config.getConfig = () => ({ impresoraLocal: { nombre: 'X', cola: 'x', conexion: 'SISTEMA', perfil: 'MM_80' } });
    service.imprimirTicketDirecto('Cheque anulado Nº 1', generar);
    expect(generar).toHaveBeenCalledOnceWith(80);
  });

  it('sin impresora en esta PC usa la de ticket del registro, como antes', () => {
    config.getConfig = () => ({ impresoraLocal: null });
    service.imprimirTicketDirecto('Cheque anulado Nº 1', generar);

    expect(impresoras.todas).toHaveBeenCalled();
    expect(generar).toHaveBeenCalledOnceWith(80);
    expect(electron.printLocal).toHaveBeenCalledOnceWith(jasmine.objectContaining({ conexion: 'CUPS', cola: 'ticket_soporte' }));
  });

  it('el error de la impresora dice en cuál falló', () => {
    electron.printLocal.and.returnValue(of({ success: false, error: 'lp: Error - The printer or class does not exist.' }));
    service.imprimirTicketDirecto('Cheque anulado Nº 1', generar);
    expect(avisos[0].texto).toBe('No se pudo imprimir en FRC-TICKET: lp: Error - The printer or class does not exist.');
  });

  it('fuera de la app de escritorio avisa y no imprime', () => {
    electron.isElectron = false;
    service.imprimirTicketDirecto('Cheque anulado Nº 1', generar);
    expect(generar).not.toHaveBeenCalled();
    expect(electron.printLocal).not.toHaveBeenCalled();
    expect(avisos[0].texto).toContain('app de escritorio');
  });
});
