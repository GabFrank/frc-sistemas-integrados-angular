import { EMPTY, NEVER, Observable, Subject, of, throwError } from 'rxjs';
import { GenericCrudService, LECTURA_ESTRICTA, PROPAGAR_ERROR_DE_RED } from './generic-crud.service';

/**
 * onCustomQuery siempre termina (#390). Sin `errorConf`, el error de red llega a quien llama, y el genérico
 * avisa solo si quien llama no avisó.
 */
describe('GenericCrudService: onCustomQuery', () => {
  let service: GenericCrudService;
  let notification$: Subject<any>;
  let avisos: string[];
  let abiertos: number;
  let cerrados: any[];
  let respuesta: Observable<any>;
  let canceladas: number;

  const GQL: any = { document: {} };
  const leer = (obs: Observable<any>, alFallar?: () => void) => {
    const r = { valores: [] as any[], completo: false, error: undefined as any, fallo: false };
    obs.subscribe({
      next: v => r.valores.push(v),
      error: e => { r.error = e; r.fallo = true; alFallar?.(); },
      complete: () => r.completo = true,
    });
    return r;
  };
  // Con la forma real: un ApolloError es instanceof Error, con `networkError` y `graphQLErrors` vacío.
  const errorDeRed = () => Object.assign(new Error('Failed to fetch'), { networkError: new TypeError('Failed to fetch'), graphQLErrors: [] });
  const red = () => throwError(() => errorDeRed());
  const RECHAZO = of({ data: null, errors: [{ message: 'sin permiso' }] });

  beforeEach(() => {
    notification$ = new Subject<any>();
    avisos = [];
    abiertos = 0;
    cerrados = [];
    canceladas = 0;
    notification$.subscribe(n => avisos.push(n.texto));
    const notificacion: any = { notification$ };
    const cargando: any = {
      openDialog: () => { abiertos++; return { requestId: 7 }; },
      closeDialog: (id: any) => cerrados.push(id),
    };
    const apollo: any = { query: () => respuesta };
    service = new GenericCrudService(notificacion, null, notificacion, cargando, { get: () => null } as any, apollo);
  });

  it('emite el dato y completa, cerrando el «Buscando…»', () => {
    respuesta = of({ data: { data: [1, 2] } });
    const r = leer(service.onCustomQuery(GQL, {}));
    expect(r.valores).toEqual([[1, 2]]);
    expect(r.completo).toBeTrue();
    expect(abiertos).toBe(1);
    expect(cerrados).toEqual([7]);
    expect(avisos).toEqual([]);
  });

  it('silentLoad no abre ni cierra el «Buscando…»', () => {
    respuesta = of({ data: { data: 1 } });
    leer(service.onCustomQuery(GQL, {}, true, null, true));
    expect(abiertos).toBe(0);
    expect(cerrados).toEqual([]);
  });

  it('rechazo del servidor: avisa y emite null (como siempre)', () => {
    respuesta = RECHAZO;
    const r = leer(service.onCustomQuery(GQL, {}));
    expect(r.valores).toEqual([null]);
    expect(r.completo).toBeTrue();
    expect(avisos.length).toBe(1);
    expect(avisos[0]).toContain('sin permiso');
  });

  it('rechazo con datos parciales: emite lo que vino', () => {
    respuesta = of({ data: { data: { id: 1 } }, errors: [{ message: 'campo x' }] });
    const r = leer(service.onCustomQuery(GQL, {}));
    expect(r.valores).toEqual([{ id: 1 }]);
  });

  it('rechazo con LECTURA_ESTRICTA: falla sin aviso', () => {
    respuesta = RECHAZO;
    const r = leer(service.onCustomQuery(GQL, {}, true, LECTURA_ESTRICTA));
    expect(r.fallo).toBeTrue();
    expect(r.error.message).toContain('sin permiso');
    expect(avisos).toEqual([]);
  });

  it('error de red sin errorConf: falla hacia quien llama, avisa una vez y cierra el «Buscando…»', () => {
    respuesta = red();
    const r = leer(service.onCustomQuery(GQL, {}));
    expect(r.fallo).toBeTrue();
    expect(r.error instanceof Error).toBeTrue();
    expect(r.valores).toEqual([]);
    expect(cerrados).toEqual([7]);
    expect(avisos.length).toBe(1);
    expect(avisos[0]).toContain('No se pudo consultar');
  });

  it('error de red con errorConf null (wrappers que hacen `errorConf ?? null`): igual que sin errorConf', () => {
    respuesta = red();
    const r = leer(service.onCustomQuery(GQL, {}, true, null));
    expect(r.fallo).toBeTrue();
    expect(avisos.length).toBe(1);
  });

  it('varias lecturas que fallan juntas: un solo aviso', () => {
    respuesta = red();
    leer(service.onCustomQuery(GQL, {}));
    leer(service.onCustomQuery(GQL, {}));
    leer(service.onCustomQuery(GQL, {}));
    expect(avisos.length).toBe(1);
  });

  it('si quien llama avisa en su error:, el genérico no agrega el suyo', () => {
    respuesta = red();
    const r = leer(service.onCustomQuery(GQL, {}), () => notification$.next({ texto: 'No se pudo cargar la caja' }));
    expect(r.fallo).toBeTrue();
    expect(avisos).toEqual(['No se pudo cargar la caja']);
  });

  it('con sinAviso (sondeos, arranque): falla sin aviso', () => {
    respuesta = red();
    const r = leer(service.onCustomQuery(GQL, {}, true, null, true, { sinAviso: true }));
    expect(r.fallo).toBeTrue();
    expect(avisos).toEqual([]);
  });

  it('error de red con PROPAGAR_ERROR_DE_RED: falla sin aviso (sin cambios)', () => {
    respuesta = red();
    const r = leer(service.onCustomQuery(GQL, {}, true, PROPAGAR_ERROR_DE_RED));
    expect(r.fallo).toBeTrue();
    expect(avisos).toEqual([]);
  });

  it('error de red con errorConf que no propaga: no emite (sin cambios), pero cierra el «Buscando…»', () => {
    respuesta = red();
    const r = leer(service.onCustomQuery(GQL, {}, true, { networkError: { show: true } }));
    expect(r.fallo).toBeFalse();
    expect(r.completo).toBeFalse();
    expect(avisos).toEqual(['Error de red']);
    expect(cerrados).toEqual([7]);
  });

  it('respuesta vacía: se trata como rechazo (null)', () => {
    respuesta = of(null);
    const r = leer(service.onCustomQuery(GQL, {}));
    expect(r.valores).toEqual([null]);
    expect(r.completo).toBeTrue();
  });

  it('respuesta sin data ni errors: emite null en vez de romper', () => {
    respuesta = of({});
    const r = leer(service.onCustomQuery(GQL, {}));
    expect(r.valores).toEqual([null]);
    expect(r.completo).toBeTrue();
    expect(cerrados).toEqual([7]);
  });

  it('la consulta completa sin emitir: emite null y completa', () => {
    spyOn(console, 'warn');
    respuesta = EMPTY;
    const r = leer(service.onCustomQuery(GQL, {}));
    expect(r.valores).toEqual([null]);
    expect(r.completo).toBeTrue();
    expect(cerrados).toEqual([7]);
  });

  it('si quien llama deja de escuchar, la consulta se cancela y el «Buscando…» se cierra', () => {
    respuesta = new Observable(() => () => canceladas++);
    const sub = service.onCustomQuery(GQL, {}).subscribe();
    expect(cerrados).toEqual([]);
    sub.unsubscribe();
    expect(canceladas).toBe(1);
    expect(cerrados).toEqual([7]);
  });

  it('una consulta cancelada no avisa su error después', () => {
    const lenta = new Subject<any>();
    respuesta = lenta;
    const sub = service.onCustomQuery(GQL, {}).subscribe({ error: () => {} });
    sub.unsubscribe();
    lenta.error(errorDeRed());
    expect(avisos).toEqual([]);
  });

  it('el «Buscando…» se cierra una sola vez', () => {
    respuesta = NEVER;
    const sub = service.onCustomQuery(GQL, {}).subscribe();
    sub.unsubscribe();
    sub.unsubscribe();
    expect(cerrados).toEqual([7]);
  });
});
