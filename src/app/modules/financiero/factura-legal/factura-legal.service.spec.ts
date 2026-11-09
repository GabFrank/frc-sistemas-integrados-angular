import { Observable, Subject, of, throwError } from 'rxjs';
import { esRechazoDelServidor } from '../../../commons/core/utils/graphqlErrorUtils';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { FacturaLegalService } from './factura-legal.service';

describe('FacturaLegalService: onSaveFactura', () => {
  let avisos: string[];
  let impresos: any[];
  let desdeEstaPc: boolean;

  const errorDeRed = () => Object.assign(new Error('Failed to fetch'), { networkError: new TypeError('Failed to fetch'), graphQLErrors: [] });

  const servicio = (respuesta: Observable<any>): FacturaLegalService => {
    const notification$ = new Subject<any>();
    notification$.subscribe(n => avisos.push(n.texto));
    const notificacion: any = { notification$ };
    const cargando: any = { openDialog: () => ({ requestId: 7 }), closeDialog: () => {} };
    const generico = new GenericCrudService(notificacion, null, notificacion, cargando, { get: () => null } as any, null);
    const args: any[] = new Array(26).fill(null);
    args[0] = { mutate: () => respuesta };
    args[1] = generico;
    args[2] = notificacion;
    args[12] = { getConfig: () => ({ pdvId: 1, printers: { ticket: 'ticket' } }) };
    args[25] = {
      porCliente: () => desdeEstaPc,
      imprimirTicket: (...a: any[]) => { impresos.push(a); return of(null); },
    };
    return new (FacturaLegalService as any)(...args);
  };

  const emitir = (respuesta: Observable<any>) => {
    const valores: any[] = [];
    servicio(respuesta).onSaveFactura({} as any, [], false).subscribe(v => valores.push(v));
    return valores;
  };

  beforeEach(() => {
    avisos = [];
    impresos = [];
    desdeEstaPc = false;
    spyOn(console, 'warn');
  });

  it('guardada: emite { data } con el timbrado', () => {
    const valores = emitir(of({ data: { data: { id: 3, facturaLegalId: 9 } } }));
    expect(valores).toEqual([{ data: { id: 3, facturaLegalId: 9 } }]);
    expect(impresos).toEqual([]);
  });

  it('guardada imprimiendo desde esta PC: pide el ticket con el id de la factura', () => {
    desdeEstaPc = true;
    emitir(of({ data: { data: { id: 3, facturaLegalId: 9 } } }));
    expect(impresos.length).toBe(1);
    expect(impresos[0][1]).toBe(9);
  });

  it('rechazada: emite un error que es rechazo del servidor y avisa el motivo una sola vez', () => {
    desdeEstaPc = true;
    const valores = emitir(of({ data: null, errors: [{ message: 'Exception while fetching data (/data) : TIMBRADO_SIN_TELEFONO' }] }));
    expect(valores.length).toBe(1);
    expect(valores[0].data).toBeUndefined();
    expect(esRechazoDelServidor(valores[0].error)).toBeTrue();
    expect(avisos.length).toBe(1);
    expect(avisos[0]).toContain('TIMBRADO_SIN_TELEFONO');
    expect(impresos).toEqual([]);
  });

  it('errores con datos: emite los dos y no imprime', () => {
    desdeEstaPc = true;
    const valores = emitir(of({ data: { data: { id: 3, facturaLegalId: 9 } }, errors: [{ message: 'fallo un campo' }] }));
    expect(valores.length).toBe(1);
    expect(valores[0].data).toEqual({ id: 3, facturaLegalId: 9 });
    expect(valores[0].error.length).toBe(1);
    expect(impresos).toEqual([]);
  });

  it('error de red cuando quien llama avisa lo suyo: un solo aviso', () => {
    const s = servicio(throwError(() => errorDeRed()));
    const notification$ = (s as any).notificacionService.notification$;
    s.onSaveFactura({} as any, [], false).subscribe(() => notification$.next({ texto: 'No se pudo confirmar la factura' }));
    expect(avisos).toEqual(['No se pudo confirmar la factura']);
  });

  it('error de red: emite un error que no es rechazo', () => {
    const valores = emitir(throwError(() => errorDeRed()));
    expect(valores.length).toBe(1);
    expect(valores[0].data).toBeUndefined();
    expect(esRechazoDelServidor(valores[0].error)).toBeFalse();
  });

  it('respuesta vacía: emite un error que no es rechazo', () => {
    const valores = emitir(of(null));
    expect(valores.length).toBe(1);
    expect(esRechazoDelServidor(valores[0].error)).toBeFalse();
  });
});

describe('FacturaLegalService: onReimprimirFactura', () => {
  let avisos: string[];
  let exitos: number;

  /** El backend responde `respuesta` (true / false / null por error GraphQL ya avisado por el genérico). */
  const reimprimir = (respuesta: boolean | null) => {
    const notificacion: any = {
      openWarn: (texto: string) => avisos.push(texto),
      openGuardadoConExito: () => exitos++,
    };
    const args: any[] = new Array(26).fill(null);
    args[1] = { onCustomQuery: () => of(respuesta) };
    args[2] = notificacion;
    args[12] = { getConfig: () => ({ printers: { ticket: 'ticket' } }) };
    args[25] = { contextoImpresionServidor: {}, avisarSinRespuesta: () => (o: Observable<any>) => o };
    (new (FacturaLegalService as any)(...args) as FacturaLegalService).onReimprimirFactura(9, 1);
  };

  beforeEach(() => {
    avisos = [];
    exitos = 0;
  });

  it('si el backend no pudo imprimir avisa que la factura esta guardada pero no salio', () => {
    reimprimir(false);
    expect(exitos).toBe(0);
    expect(avisos.length).toBe(1);
    expect(avisos[0]).toContain('La factura está guardada, pero no se pudo reimprimir');
  });

  it('si imprimio avisa exito', () => {
    reimprimir(true);
    expect(exitos).toBe(1);
    expect(avisos).toEqual([]);
  });

  it('con un error GraphQL (null) no agrega otro aviso: ya lo mostro el generico', () => {
    reimprimir(null);
    expect(exitos).toBe(0);
    expect(avisos).toEqual([]);
  });
});
