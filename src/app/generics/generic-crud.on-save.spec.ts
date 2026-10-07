import { EMPTY, Observable, of, throwError } from 'rxjs';
import { erroresDeRechazo, esRechazoDelServidor } from '../commons/core/utils/graphqlErrorUtils';
import { GenericCrudService, PROPAGAR_ERROR_DE_RED } from './generic-crud.service';

/** onSave siempre termina: emite lo guardado, o falla; y ante un error de red avisa (#390). */
describe('GenericCrudService.onSave', () => {
  let service: GenericCrudService;
  let avisos: string[];
  let cerrados: any[];

  const mutation = (respuesta: Observable<any>): any => ({ mutate: () => respuesta });

  const leer = (obs: Observable<any>) => {
    const r = { valores: [] as any[], completo: false, error: undefined as any, fallo: false };
    obs.subscribe({
      next: v => r.valores.push(v),
      error: e => { r.error = e; r.fallo = true; },
      complete: () => r.completo = true,
    });
    return r;
  };

  beforeEach(() => {
    avisos = [];
    cerrados = [];
    const notificacion: any = { notification$: { next: (n: any) => avisos.push(n.texto) } };
    const cargando: any = { openDialog: () => ({ requestId: 7 }), closeDialog: (id: any) => cerrados.push(id) };
    const injector: any = { get: () => null };
    service = new GenericCrudService(notificacion, null, notificacion, cargando, injector, null);
    (service as any).mainService = { usuarioActual: { id: 1 } };
  });

  it('emite lo guardado, completa y avisa el éxito', () => {
    const r = leer(service.onSave(mutation(of({ data: { data: { id: 5 } } })), {}));
    expect(r.valores).toEqual([{ id: 5 }]);
    expect(r.completo).toBeTrue();
    expect(r.fallo).toBeFalse();
    expect(cerrados).toEqual([7]);
    expect(avisos).toEqual(['Guardado con éxito']);
  });

  it('un rechazo falla con el arreglo de errores y avisa «Ups»', () => {
    const r = leer(service.onSave(mutation(of({ data: null, errors: [{ message: 'ya existe' }] })), {}));
    expect(r.valores).toEqual([]);
    expect(esRechazoDelServidor(r.error)).toBeTrue();
    expect(cerrados).toEqual([7]);
    expect(avisos.length).toBe(1);
    expect(avisos[0]).toContain('ya existe');
  });

  it('un rechazo con datos emite y completa (antes no completaba)', () => {
    const r = leer(service.onSave(mutation(of({ data: { data: { id: 5 } }, errors: [{ message: 'x' }] })), {}));
    expect(r.valores).toEqual([{ id: 5 }]);
    expect(r.completo).toBeTrue();
    expect(r.fallo).toBeFalse();
  });

  it('un error de red falla con el error tal cual y avisa que no se pudo confirmar', () => {
    const error = { networkError: true };
    const r = leer(service.onSave(mutation(throwError(() => error)), {}));
    expect(r.error).toBe(error);
    expect(r.valores).toEqual([]);
    expect(erroresDeRechazo(r.error)).toBeNull();
    expect(cerrados).toEqual([7]);
    expect(avisos).toEqual(['No se pudo confirmar si se guardó (error de red): pudo haberse aplicado, verificá antes de repetir.']);
  });

  it('con un status HTTP lo dice en el aviso', () => {
    leer(service.onSave(mutation(throwError(() => ({ networkError: { status: 500 } }))), {}));
    expect(avisos).toEqual(['No se pudo confirmar si se guardó: el servidor respondió HTTP 500. Verificá antes de repetir.']);
  });

  it('con networkError.show = false falla sin avisar', () => {
    const r = leer(service.onSave(mutation(throwError(() => ({ networkError: true }))), {}, null, null, true,
      PROPAGAR_ERROR_DE_RED));
    expect(r.fallo).toBeTrue();
    expect(avisos).toEqual([]);
  });

  it('con errorConf sin show (solo propagate) avisa igual', () => {
    leer(service.onSave(mutation(throwError(() => ({ networkError: true }))), {}, null, null, true,
      { networkError: { propagate: true } }));
    expect(avisos.length).toBe(1);
  });

  it('el corte por tiempo del link falla sin sumar aviso', () => {
    const r = leer(service.onSave(mutation(throwError(() => ({ esTimeout: true }))), {}));
    expect(r.fallo).toBeTrue();
    expect(avisos).toEqual([]);
  });

  it('el mismo guardado fallando varias veces seguidas avisa una sola vez', () => {
    const gql = mutation(throwError(() => ({ networkError: true })));
    leer(service.onSave(gql, {}));
    leer(service.onSave(gql, {}));
    expect(avisos.length).toBe(1);
  });

  it('si la mutation completa sin emitir, falla como respuesta vacía (no es un rechazo)', () => {
    const r = leer(service.onSave(mutation(EMPTY), {}));
    expect(r.fallo).toBeTrue();
    expect(esRechazoDelServidor(r.error)).toBeFalse();
    expect(cerrados).toEqual([7]);
  });

  it('una respuesta nula del link falla como respuesta vacía', () => {
    const r = leer(service.onSave(mutation(of(null)), {}));
    expect(r.fallo).toBeTrue();
    expect(esRechazoDelServidor(r.error)).toBeFalse();
  });

  it('una respuesta sin data ni errores falla como respuesta vacía', () => {
    const r = leer(service.onSave(mutation(of({})), {}));
    expect(r.fallo).toBeTrue();
    expect(r.valores).toEqual([]);
    expect(esRechazoDelServidor(r.error)).toBeFalse();
    expect(avisos.length).toBe(1);
  });

  it('completa el usuarioId del input cuando viene vacío', () => {
    const input: any = { usuarioId: null };
    leer(service.onSave(mutation(of({ data: { data: {} } })), input));
    expect(input.usuarioId).toBe(1);
  });
});
