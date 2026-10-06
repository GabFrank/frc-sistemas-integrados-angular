import { EMPTY, Observable, of, throwError } from 'rxjs';
import { GenericCrudService, PROPAGAR_ERROR_DE_RED, SIN_AVISO_DEL_GENERICO } from './generic-crud.service';

/** onGetAll siempre termina: resultado, o null ante cualquier falla (#390). */
describe('GenericCrudService.onGetAll', () => {
  let service: GenericCrudService;
  let avisos: string[];
  let cerrados: any[];

  const consulta = (respuesta: Observable<any>): any => ({ fetch: () => respuesta });

  /** Lo que emitió, si completó y con qué error terminó. */
  const leer = (obs: Observable<any>) => {
    const r = { valores: [] as any[], completo: false, error: undefined as any };
    obs.subscribe({ next: v => r.valores.push(v), error: e => r.error = e, complete: () => r.completo = true });
    return r;
  };

  beforeEach(() => {
    avisos = [];
    cerrados = [];
    const notificacion: any = { notification$: { next: (n: any) => avisos.push(n.texto) } };
    const cargando: any = { openDialog: () => ({ requestId: 7 }), closeDialog: (id: any) => cerrados.push(id) };
    const injector: any = { get: () => null };
    service = new GenericCrudService(notificacion, null, notificacion, cargando, injector, null);
  });

  it('emite la lista y completa', () => {
    const r = leer(service.onGetAll(consulta(of({ data: { data: [1, 2] } }))));
    expect(r.valores).toEqual([[1, 2]]);
    expect(r.completo).toBeTrue();
    expect(cerrados).toEqual([7]);
    expect(avisos).toEqual([]);
  });

  it('una lista vacía sigue siendo una lista vacía', () => {
    expect(leer(service.onGetAll(consulta(of({ data: { data: [] } })))).valores).toEqual([[]]);
  });

  it('ante un error del servidor avisa, emite null y completa', () => {
    const r = leer(service.onGetAll(consulta(of({ data: null, errors: [{ message: 'sin permiso' }] }))));
    expect(r.valores).toEqual([null]);
    expect(r.completo).toBeTrue();
    expect(cerrados).toEqual([7]);
    expect(avisos.length).toBe(1);
    expect(avisos[0]).toContain('sin permiso');
  });

  it('con errores no emite datos parciales', () => {
    const r = leer(service.onGetAll(consulta(of({ data: { data: [1] }, errors: [{ message: 'x' }] }))));
    expect(r.valores).toEqual([null]);
  });

  it('un arreglo de errores vacío no es un error', () => {
    const r = leer(service.onGetAll(consulta(of({ data: { data: [1] }, errors: [] }))));
    expect(r.valores).toEqual([[1]]);
    expect(avisos).toEqual([]);
  });

  it('ante un error de red emite null y completa', () => {
    const r = leer(service.onGetAll(consulta(throwError(() => ({ networkError: true })))));
    expect(r.valores).toEqual([null]);
    expect(r.completo).toBeTrue();
    expect(cerrados).toEqual([7]);
    expect(avisos).toEqual(['No se pudo cargar: Error de red']);
  });

  it('varias lecturas que fallan juntas avisan una sola vez', () => {
    leer(service.onGetAll(consulta(throwError(() => ({ networkError: true })))));
    leer(service.onGetAll(consulta(throwError(() => ({ networkError: true })))));
    expect(avisos.length).toBe(1);
  });

  it('con un status HTTP no dice «Error de red»', () => {
    leer(service.onGetAll(consulta(throwError(() => ({ networkError: { status: 500 } })))));
    expect(avisos).toEqual(['No se pudo cargar: El servidor rechazó la operación (HTTP 500)']);
  });

  it('el corte por tiempo del link no suma aviso', () => {
    leer(service.onGetAll(consulta(throwError(() => ({ esTimeout: true })))));
    expect(avisos).toEqual([]);
  });

  it('si la consulta completa sin emitir, emite null y completa', () => {
    const r = leer(service.onGetAll(consulta(EMPTY)));
    expect(r.valores).toEqual([null]);
    expect(r.completo).toBeTrue();
    expect(cerrados).toEqual([7]);
  });

  it('una respuesta sin data ni errores emite null', () => {
    expect(leer(service.onGetAll(consulta(of({})))).valores).toEqual([null]);
  });

  it('con PROPAGAR_ERROR_DE_RED el error de red llega a quien llama, sin aviso', () => {
    const error = { networkError: true };
    const r = leer(service.onGetAll(consulta(throwError(() => error)), null, null, true, PROPAGAR_ERROR_DE_RED));
    expect(r.valores).toEqual([]);
    expect(r.error).toBe(error);
    expect(cerrados).toEqual([7]);
    expect(avisos).toEqual([]);
  });

  it('con graphError.propagate el rechazo llega a quien llama como { message, errors }', () => {
    const gql = consulta(of({ data: null, errors: [{ message: 'sin permiso' }] }));
    const r = leer(service.onGetAll(gql, null, null, true, { graphError: { propagate: true, show: false } }));
    expect(r.valores).toEqual([]);
    expect(r.error.message).toContain('sin permiso');
    expect(r.error.errors.length).toBe(1);
    expect(cerrados).toEqual([7]);
    expect(avisos).toEqual([]);
  });

  it('con SIN_AVISO_DEL_GENERICO no avisa y emite null', () => {
    const gql = consulta(of({ data: null, errors: [{ message: 'x' }] }));
    expect(leer(service.onGetAll(gql, null, null, true, SIN_AVISO_DEL_GENERICO)).valores).toEqual([null]);
    expect(leer(service.onGetAll(consulta(throwError(() => ({}))), null, null, true, SIN_AVISO_DEL_GENERICO)).valores)
      .toEqual([null]);
    expect(avisos).toEqual([]);
  });
});
