import { Observable, of, throwError } from 'rxjs';
import { esRechazoDelServidor } from '../commons/core/utils/graphqlErrorUtils';
import { GenericCrudService } from './generic-crud.service';

/** onCustomMutation: el rechazo avisa una vez aunque la misma mutation falle igual en paralelo (#501). */
describe('GenericCrudService.onCustomMutation', () => {
  let service: GenericCrudService;
  let avisos: string[];

  const mutation = (respuesta: Observable<any>): any => ({ mutate: () => respuesta });
  const leer = (obs: Observable<any>) => {
    const r = { valores: [] as any[], error: undefined as any, fallo: false };
    obs.subscribe({ next: v => r.valores.push(v), error: e => { r.error = e; r.fallo = true; } });
    return r;
  };
  const RECHAZO = () => of({ data: null, errors: [{ message: 'el ítem ya fue verificado' }] });

  beforeEach(() => {
    avisos = [];
    const notificacion: any = { notification$: { next: (n: any) => avisos.push(n.texto) } };
    const cargando: any = { openDialog: () => ({ requestId: 7 }), closeDialog: () => {} };
    service = new GenericCrudService(notificacion, null, notificacion, cargando, { get: () => null } as any, null);
  });

  it('emite la respuesta sin aviso de éxito', () => {
    const r = leer(service.onCustomMutation(mutation(of({ data: { data: true } })), {}));
    expect(r.valores).toEqual([true]);
    expect(avisos).toEqual([]);
  });

  it('un rechazo falla con los errores y avisa «Ups»', () => {
    const r = leer(service.onCustomMutation(mutation(RECHAZO()), {}));
    expect(esRechazoDelServidor(r.error)).toBeTrue();
    expect(avisos.length).toBe(1);
    expect(avisos[0]).toContain('el ítem ya fue verificado');
  });

  it('el mismo rechazo de la misma mutation en paralelo avisa una sola vez, y todas fallan', () => {
    const gql = mutation(RECHAZO());
    const rs = [1, 2, 3].map(() => leer(service.onCustomMutation(gql, {})));
    expect(rs.every(r => r.fallo)).toBeTrue();
    expect(avisos.length).toBe(1);
  });

  it('con silentLoad un rechazo no avisa', () => {
    const r = leer(service.onCustomMutation(mutation(RECHAZO()), {}, true, true));
    expect(r.fallo).toBeTrue();
    expect(avisos).toEqual([]);
  });

  it('silenciarAvisoTimeout llega al context del link solo cuando se pide (#528)', () => {
    const contextos: any[] = [];
    const gql: any = { mutate: (_d: any, o: any) => { contextos.push(o.context); return of({ data: { data: true } }); } };
    leer(service.onCustomMutation(gql, {}, true, true, { silenciarAvisoTimeout: true }));
    leer(service.onCustomMutation(gql, {}, true, true));
    leer(service.onCustomMutation(gql, {}, true, true, { timeoutMs: 5000 }));
    expect(contextos[0].silenciarAvisoTimeout).toBeTrue();
    expect('silenciarAvisoTimeout' in contextos[1]).toBeFalse();
    expect('silenciarAvisoTimeout' in contextos[2]).toBeFalse();
    expect(contextos[2].timeoutMs).toBe(5000);
  });

  it('un error de red falla tal cual, sin aviso del genérico', () => {
    const error = { networkError: true };
    const r = leer(service.onCustomMutation(mutation(throwError(() => error)), {}));
    expect(r.error).toBe(error);
    expect(avisos).toEqual([]);
  });
});
