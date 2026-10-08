import { EMPTY, Observable, Subject, of, throwError } from 'rxjs';
import { GenericCrudService } from './generic-crud.service';

/**
 * onDelete y onDeleteWithSucId siempre terminan (#390): `true` si se eliminó, `null` si no, y cancelar la
 * confirmación completa sin emitir y sin dejar el «Eliminando…» tapando la pantalla.
 */
describe('GenericCrudService: onDelete y onDeleteWithSucId', () => {
  let service: GenericCrudService;
  let avisos: string[];
  let abiertos: string[];
  let cerrados: any[];
  let confirmaciones: any[][];
  let respuestaConfirmacion: Observable<any>;
  let variables: any[];

  const mutacion = (respuesta: Observable<any>): any => ({
    mutate: (v: any) => { variables.push(v); return respuesta; },
  });
  const leer = (obs: Observable<any>) => {
    const r = { valores: [] as any[], completo: false, fallo: false };
    obs.subscribe({ next: v => r.valores.push(v), error: () => r.fallo = true, complete: () => r.completo = true });
    return r;
  };
  const OK = of({ data: { data: true } });
  const RECHAZO = of({ data: null, errors: [{ message: 'tiene movimientos' }] });
  const red = () => throwError(() => Object.assign(new Error('Failed to fetch'), { networkError: new TypeError('Failed to fetch'), graphQLErrors: [] }));

  beforeEach(() => {
    avisos = [];
    abiertos = [];
    cerrados = [];
    confirmaciones = [];
    variables = [];
    respuestaConfirmacion = of(true);
    const notificacion: any = { notification$: { next: (n: any) => avisos.push(n.texto) } };
    const cargando: any = {
      openDialog: (_: any, texto: string) => { abiertos.push(texto); return { requestId: 7 }; },
      closeDialog: (id: any) => cerrados.push(id),
    };
    const dialogos: any = { confirm: (...a: any[]) => { confirmaciones.push(a); return respuestaConfirmacion; } };
    service = new GenericCrudService(notificacion, dialogos, notificacion, cargando, { get: () => null } as any, null);
  });

  describe('sin confirmación', () => {
    it('éxito: avisa, emite true y completa', () => {
      const r = leer(service.onDelete(mutacion(OK), 5, null, null, false));
      expect(r.valores).toEqual([true]);
      expect(r.completo).toBeTrue();
      expect(confirmaciones.length).toBe(0);
      expect(avisos).toEqual(['Eliminado con éxito']);
      expect(cerrados).toEqual([7]);
      expect(variables).toEqual([{ id: 5 }]);
    });

    it('rechazo: avisa, emite null y completa (antes no completaba)', () => {
      const r = leer(service.onDelete(mutacion(RECHAZO), 5, null, null, false));
      expect(r.valores).toEqual([null]);
      expect(r.completo).toBeTrue();
      expect(avisos.length).toBe(1);
      expect(avisos[0]).toContain('tiene movimientos');
      expect(cerrados).toEqual([7]);
    });

    it('error de red: avisa que pudo haberse aplicado, emite null y completa', () => {
      const r = leer(service.onDelete(mutacion(red()), 5, null, null, false));
      expect(r.valores).toEqual([null]);
      expect(r.completo).toBeTrue();
      expect(r.fallo).toBeFalse();
      expect(avisos.length).toBe(1);
      expect(avisos[0]).toContain('pudo haberse aplicado');
      expect(cerrados).toEqual([7]);
    });

    it('la mutación completa sin emitir: null y completa', () => {
      const r = leer(service.onDelete(mutacion(EMPTY), 5, null, null, false));
      expect(r.valores).toEqual([null]);
      expect(r.completo).toBeTrue();
      expect(cerrados).toEqual([7]);
    });

    it('respuesta vacía: se trata como rechazo', () => {
      const r = leer(service.onDelete(mutacion(of(null)), 5, null, null, false));
      expect(r.valores).toEqual([null]);
      expect(r.completo).toBeTrue();
    });

    it('el Boolean false del backend no cambia el resultado (también es «ya no existía»)', () => {
      const r = leer(service.onDelete(mutacion(of({ data: { data: false } })), 5, null, null, false));
      expect(r.valores).toEqual([true]);
    });
  });

  describe('con confirmación', () => {
    it('pide confirmación con el título y el mensaje dados, y no abre «Eliminando…» hasta confirmar', () => {
      const confirmar = new Subject<any>();
      respuestaConfirmacion = confirmar;
      const r = leer(service.onDelete(mutacion(OK), 5, 'Borrar', null, true, true, '¿Seguro?'));
      expect(confirmaciones).toEqual([['Borrar', '¿Seguro?']]);
      expect(abiertos).toEqual([]);
      expect(variables).toEqual([]);
      confirmar.next(true);
      expect(abiertos).toEqual(['Eliminando...']);
      expect(r.valores).toEqual([true]);
      expect(r.completo).toBeTrue();
    });

    it('showDialog sin definir también pide confirmación', () => {
      leer(service.onDelete(mutacion(OK), 5));
      expect(confirmaciones.length).toBe(1);
    });

    it('cancelar: no borra, no abre «Eliminando…», completa sin emitir', () => {
      respuestaConfirmacion = of(false);
      const r = leer(service.onDelete(mutacion(OK), 5));
      expect(variables).toEqual([]);
      expect(abiertos).toEqual([]);
      expect(cerrados).toEqual([]);
      expect(r.valores).toEqual([]);
      expect(r.completo).toBeTrue();
      expect(avisos).toEqual([]);
    });

    it('error de red tras confirmar: avisa, null y completa', () => {
      const r = leer(service.onDelete(mutacion(red()), 5));
      expect(r.valores).toEqual([null]);
      expect(r.completo).toBeTrue();
      expect(avisos[0]).toContain('pudo haberse aplicado');
      expect(cerrados).toEqual([7]);
    });
  });

  describe('onDeleteWithSucId', () => {
    it('sin confirmación manda id y sucId', () => {
      const r = leer(service.onDeleteWithSucId(mutacion(OK), 5, 3, 'item', null, false, false));
      expect(variables).toEqual([{ id: 5, sucId: 3 }]);
      expect(r.valores).toEqual([true]);
      expect(r.completo).toBeTrue();
    });

    it('con confirmación también manda el sucId (antes se perdía)', () => {
      const r = leer(service.onDeleteWithSucId(mutacion(OK), 5, 3, 'item'));
      expect(confirmaciones).toEqual([['Atención!!', 'Realemente desea eliminar este item']]);
      expect(variables).toEqual([{ id: 5, sucId: 3 }]);
      expect(r.valores).toEqual([true]);
    });

    it('rechazo sin confirmación: null y completa', () => {
      const r = leer(service.onDeleteWithSucId(mutacion(RECHAZO), 5, 3, 'item', null, false, false));
      expect(r.valores).toEqual([null]);
      expect(r.completo).toBeTrue();
    });
  });
});
