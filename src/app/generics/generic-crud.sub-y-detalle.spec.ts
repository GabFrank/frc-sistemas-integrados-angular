import { Observable, Subject, of, throwError } from 'rxjs';
import { GenericCrudService } from './generic-crud.service';

describe('GenericCrudService: onCustomSub y onSaveConDetalle', () => {
  let service: GenericCrudService;
  let notification$: Subject<any>;
  let avisos: string[];
  let cerrados: any[];

  const leer = (obs: Observable<any>, alRecibir?: (v: any) => void) => {
    const r = { valores: [] as any[], completo: false, fallo: false, sub: null as any };
    r.sub = obs.subscribe({
      next: v => { r.valores.push(v); alRecibir?.(v); },
      error: () => r.fallo = true,
      complete: () => r.completo = true,
    });
    return r;
  };
  const errorDeRed = () => Object.assign(new Error('Failed to fetch'), { networkError: new TypeError('Failed to fetch'), graphQLErrors: [] });

  beforeEach(() => {
    notification$ = new Subject<any>();
    avisos = [];
    cerrados = [];
    notification$.subscribe(n => avisos.push(n.texto));
    const notificacion: any = { notification$ };
    const cargando: any = { openDialog: () => ({ requestId: 7 }), closeDialog: (id: any) => cerrados.push(id) };
    service = new GenericCrudService(notificacion, null, notificacion, cargando, { get: () => null } as any, null);
    spyOn(console, 'warn');
  });

  describe('onCustomSub', () => {
    let canal: Subject<any>;
    let cortes: number;
    const sub = (): any => ({
      subscribe: () => new Observable(o => { const s = canal.subscribe(o); return () => { cortes++; s.unsubscribe(); }; }),
    });

    beforeEach(() => { canal = new Subject<any>(); cortes = 0; });

    it('no se corta con el primer aviso: entrega también el siguiente (el canal es compartido)', () => {
      const r = leer(service.onCustomSub(sub(), null, true, false));
      canal.next({ data: { data: { transferenciaId: 1 } } });
      canal.next({ data: { data: { transferenciaId: 2 } } });
      expect(r.valores).toEqual([{ transferenciaId: 1 }, { transferenciaId: 2 }]);
      expect(r.completo).toBeFalse();
    });

    it('al dejar de escuchar corta la conexión', () => {
      const r = leer(service.onCustomSub(sub(), null, true, false));
      expect(cortes).toBe(0);
      r.sub.unsubscribe();
      expect(cortes).toBe(1);
      canal.next({ data: { data: 1 } });
      expect(r.valores).toEqual([]);
    });

    it('un aviso con error se avisa y se sigue escuchando', () => {
      const r = leer(service.onCustomSub(sub(), null, true, false));
      canal.next({ data: null, errors: [{ message: 'sin permiso' }] });
      canal.next({ data: { data: 5 } });
      expect(avisos.length).toBe(1);
      expect(avisos[0]).toContain('sin permiso');
      expect(r.valores).toEqual([5]);
    });

    it('si la conexión se corta, completa sin fallar', () => {
      const r = leer(service.onCustomSub(sub(), null, true, false));
      canal.error(errorDeRed());
      expect(r.completo).toBeTrue();
      expect(r.fallo).toBeFalse();
    });

    it('con cargando, el modal se cierra al primer aviso o al dejar de escuchar, una sola vez', () => {
      const r = leer(service.onCustomSub(sub(), null, true, true));
      expect(cerrados).toEqual([]);
      r.sub.unsubscribe();
      expect(cerrados).toEqual([7]);
    });
  });

  describe('onSaveConDetalle', () => {
    const mutacion = (respuesta: Observable<any>): any => ({ mutate: () => respuesta });

    it('éxito: avisa y emite el dato', () => {
      const r = leer(service.onSaveConDetalle(mutacion(of({ data: { data: { id: 3 } } })), {}, []));
      expect(r.valores).toEqual([{ id: 3 }]);
      expect(r.completo).toBeTrue();
      expect(avisos).toEqual(['Guardado con éxito!!']);
    });

    it('error de red: emite null, completa y avisa que pudo haberse aplicado', () => {
      const r = leer(service.onSaveConDetalle(mutacion(throwError(() => errorDeRed())), {}, []));
      expect(r.valores).toEqual([null]);
      expect(r.completo).toBeTrue();
      expect(avisos.length).toBe(1);
      expect(avisos[0]).toContain('pudo haberse aplicado');
      expect(cerrados).toEqual([7]);
    });

    it('error de red cuando quien llama avisa lo suyo (factura legal): un solo aviso', () => {
      const r = leer(service.onSaveConDetalle(mutacion(throwError(() => errorDeRed())), {}, []),
        (v) => { if (v == null) notification$.next({ texto: 'No se pudo confirmar la factura' }); });
      expect(r.valores).toEqual([null]);
      expect(avisos).toEqual(['No se pudo confirmar la factura']);
    });

    it('error de red con la bandera error: emite { error } y completa', () => {
      const r = leer(service.onSaveConDetalle(mutacion(throwError(() => errorDeRed())), {}, [], null, null, null, true, true));
      expect(r.valores.length).toBe(1);
      expect(r.valores[0].error instanceof Error).toBeTrue();
      expect(r.completo).toBeTrue();
    });

    it('rechazo: avisa y emite null (sin cambios)', () => {
      const r = leer(service.onSaveConDetalle(mutacion(of({ data: null, errors: [{ message: 'timbrado vencido' }] })), {}, []));
      expect(r.valores).toEqual([null]);
      expect(avisos.length).toBe(1);
      expect(avisos[0]).toContain('timbrado vencido');
    });
  });
});
