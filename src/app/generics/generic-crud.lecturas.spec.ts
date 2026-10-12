import { EMPTY, Observable, of, throwError } from 'rxjs';
import { GenericCrudService, PROPAGAR_ERROR_DE_RED } from './generic-crud.service';

/**
 * onGetById, onGetByTexto y onGetByFecha siempre terminan, y un error no se disfraza de `null`: en estas
 * lecturas `null` es «no existe» y quien llama decide cosas con eso (#390).
 */
describe('GenericCrudService: lecturas por id, texto y fecha', () => {
  let service: GenericCrudService;
  let avisos: string[];
  let abiertos: number;
  let cerrados: any[];

  const consulta = (respuesta: Observable<any>): any => ({ fetch: () => respuesta });
  const leer = (obs: Observable<any>) => {
    const r = { valores: [] as any[], completo: false, error: undefined as any, fallo: false };
    obs.subscribe({
      next: v => r.valores.push(v),
      error: e => { r.error = e; r.fallo = true; },
      complete: () => r.completo = true,
    });
    return r;
  };
  const RECHAZO = of({ data: null, errors: [{ message: 'sin permiso' }] });
  const red = () => throwError(() => ({ networkError: true }));

  beforeEach(() => {
    avisos = [];
    abiertos = 0;
    cerrados = [];
    const notificacion: any = {
      notification$: { next: (n: any) => avisos.push(n.texto) },
      openWarn: (texto: string) => avisos.push(texto),
    };
    const cargando: any = {
      openDialog: () => { abiertos++; return { requestId: 7 }; },
      closeDialog: (id: any) => cerrados.push(id),
    };
    service = new GenericCrudService(notificacion, null, notificacion, cargando, { get: () => null } as any, null);
  });

  describe('onGetById', () => {
    it('emite el dato y completa', () => {
      const r = leer(service.onGetById(consulta(of({ data: { data: { id: 5 } } })), 5));
      expect(r.valores).toEqual([{ id: 5 }]);
      expect(r.completo).toBeTrue();
      expect(r.fallo).toBeFalse();
      expect(cerrados).toEqual([7]);
    });

    it('«no existe» sigue siendo null, sin error', () => {
      const r = leer(service.onGetById(consulta(of({ data: { data: null } })), 5));
      expect(r.valores).toEqual([null]);
      expect(r.completo).toBeTrue();
      expect(r.fallo).toBeFalse();
    });

    it('sin errorConf, un error del servidor falla (no emite null) y avisa', () => {
      const r = leer(service.onGetById(consulta(RECHAZO), 5));
      expect(r.valores).toEqual([]);
      expect(r.fallo).toBeTrue();
      expect(r.error.message).toContain('sin permiso');
      expect(r.error.errors.length).toBe(1);
      expect(avisos.length).toBe(1);
      expect(cerrados).toEqual([7]);
    });

    it('sin errorConf, un error de red falla con el error tal cual y avisa', () => {
      const error = { networkError: true };
      const r = leer(service.onGetById(consulta(throwError(() => error)), 5));
      expect(r.valores).toEqual([]);
      expect(r.error).toBe(error);
      expect(avisos).toEqual(['Problema al realizar esta operación']);
      expect(cerrados).toEqual([7]);
    });

    it('el aviso de red no se repite (una consulta por grupo, búsquedas por tecla)', () => {
      leer(service.onGetById(consulta(red()), 1));
      leer(service.onGetById(consulta(red()), 2));
      expect(avisos.length).toBe(1);
    });

    it('usa el warningText como aviso de red', () => {
      leer(service.onGetById(consulta(red()), 5, null, null, true, null, null, null, null, null, 'No se pudo leer la caja'));
      expect(avisos).toEqual(['No se pudo leer la caja']);
    });

    it('el corte por tiempo del link falla sin sumar aviso', () => {
      const r = leer(service.onGetById(consulta(throwError(() => ({ esTimeout: true }))), 5));
      expect(r.fallo).toBeTrue();
      expect(avisos).toEqual([]);
    });

    it('si la consulta completa sin emitir, falla', () => {
      const r = leer(service.onGetById(consulta(EMPTY), 5));
      expect(r.fallo).toBeTrue();
      expect(r.valores).toEqual([]);
      expect(cerrados).toEqual([7]);
    });

    it('una respuesta sin data ni errores falla (no es «no existe»)', () => {
      const r = leer(service.onGetById(consulta(of({})), 5));
      expect(r.fallo).toBeTrue();
      expect(r.valores).toEqual([]);
    });

    it('con silentLoad no abre ni cierra el modal', () => {
      leer(service.onGetById(consulta(RECHAZO), 5, null, null, true, null, null, null, true));
      expect(abiertos).toBe(0);
      expect(cerrados).toEqual([]);
    });

    describe('con errorConf (los ya migrados): sin cambios', () => {
      it('un error del servidor emite null y completa', () => {
        const r = leer(service.onGetById(consulta(RECHAZO), 5, null, null, true, null, null, null, null, null, null,
          PROPAGAR_ERROR_DE_RED));
        expect(r.valores).toEqual([null]);
        expect(r.completo).toBeTrue();
        expect(r.fallo).toBeFalse();
      });

      it('con graphError.propagate el error del servidor falla', () => {
        const r = leer(service.onGetById(consulta(RECHAZO), 5, null, null, true, null, null, null, null, null, null,
          { graphError: { propagate: true, show: false } }));
        expect(r.fallo).toBeTrue();
        expect(avisos).toEqual([]);
      });

      it('con networkError.propagate el error de red falla, sin aviso', () => {
        const r = leer(service.onGetById(consulta(red()), 5, null, null, true, null, null, null, null, null, null,
          PROPAGAR_ERROR_DE_RED));
        expect(r.fallo).toBeTrue();
        expect(avisos).toEqual([]);
      });

      it('sin networkError.propagate el error de red no llega (como antes)', () => {
        const r = leer(service.onGetById(consulta(red()), 5, null, null, true, null, null, null, null, null, null,
          { graphError: { show: false } }));
        expect(r.fallo).toBeFalse();
        expect(r.valores).toEqual([]);
        expect(cerrados).toEqual([7]);
      });
    });
  });

  describe('onGetByTexto', () => {
    it('emite la lista y completa; una lista vacía sigue siendo []', () => {
      expect(leer(service.onGetByTexto(consulta(of({ data: { data: [1] } })), 'a')).valores).toEqual([[1]]);
      expect(leer(service.onGetByTexto(consulta(of({ data: { data: [] } })), 'a')).valores).toEqual([[]]);
    });

    it('sin errorConf, un error del servidor falla y avisa', () => {
      const r = leer(service.onGetByTexto(consulta(RECHAZO), 'a'));
      expect(r.fallo).toBeTrue();
      expect(r.valores).toEqual([]);
      expect(avisos.length).toBe(1);
      expect(cerrados).toEqual([7]);
    });

    it('sin errorConf, un error de red falla y avisa (antes callaba), una sola vez', () => {
      const r = leer(service.onGetByTexto(consulta(red()), 'a'));
      leer(service.onGetByTexto(consulta(red()), 'ab'));
      expect(r.fallo).toBeTrue();
      expect(avisos).toEqual(['No se pudo consultar: Error de red']);
    });

    it('si completa sin emitir, falla', () => {
      expect(leer(service.onGetByTexto(consulta(EMPTY), 'a')).fallo).toBeTrue();
    });

    it('con errorConf sin cambios: propaga solo lo pedido', () => {
      const soloRed = leer(service.onGetByTexto(consulta(RECHAZO), 'a', true, null, PROPAGAR_ERROR_DE_RED));
      expect(soloRed.fallo).toBeFalse();
      expect(soloRed.valores).toEqual([]);
      const ambos = leer(service.onGetByTexto(consulta(RECHAZO), 'a', true, null,
        { graphError: { propagate: true, show: false }, networkError: { propagate: true, show: false } }));
      expect(ambos.fallo).toBeTrue();
      expect(leer(service.onGetByTexto(consulta(red()), 'a', true, null, PROPAGAR_ERROR_DE_RED)).fallo).toBeTrue();
    });
  });

  describe('onGetByFecha', () => {
    const hoy = new Date();

    it('emite y completa', () => {
      const r = leer(service.onGetByFecha(consulta(of({ data: { data: [1] } })), hoy, hoy));
      expect(r.valores).toEqual([[1]]);
      expect(r.completo).toBeTrue();
    });

    it('un error del servidor o de red falla y avisa', () => {
      expect(leer(service.onGetByFecha(consulta(RECHAZO), hoy, hoy)).fallo).toBeTrue();
      expect(leer(service.onGetByFecha(consulta(red()), hoy, hoy)).fallo).toBeTrue();
      expect(avisos.length).toBe(2);
      expect(cerrados).toEqual([7, 7]);
    });

    it('sin fechas consulta desde ayer, no desde 1970', () => {
      let variables: any;
      const gql: any = { fetch: (v: any) => { variables = v; return of({ data: { data: [] } }); } };
      leer(service.onGetByFecha(gql, null, null));
      expect(variables.inicio.startsWith(String(new Date(Date.now() - 86400000).getFullYear()))).toBeTrue();
    });
  });
});
