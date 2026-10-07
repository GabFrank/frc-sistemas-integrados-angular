import { Subject, throwError, of } from 'rxjs';
import { switchMapSinCortar, terminarSiFalla } from './rxjsUtils';

describe('rxjsUtils', () => {
  beforeEach(() => spyOn(console, 'error'));

  it('terminarSiFalla: corre alFallar y completa sin emitir ni propagar', () => {
    const alFallar = jasmine.createSpy('alFallar');
    const next = jasmine.createSpy('next');
    const error = jasmine.createSpy('error');
    const complete = jasmine.createSpy('complete');
    throwError(() => new Error('red')).pipe(terminarSiFalla(alFallar)).subscribe({ next, error, complete });
    expect(alFallar).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it('switchMapSinCortar: el flujo sigue vivo tras dos fallos seguidos de la consulta', () => {
    const filtro = new Subject<number>();
    const recibidos: string[] = [];
    const fallos: any[] = [];
    let terminado = false;
    filtro
      .pipe(switchMapSinCortar((v) => (v < 0 ? throwError(() => new Error('red ' + v)) : of('ok ' + v)), (e) => fallos.push(e)))
      .subscribe({ next: (r) => recibidos.push(r), error: () => (terminado = true), complete: () => (terminado = true) });
    filtro.next(1);
    filtro.next(-1);
    filtro.next(-2);
    filtro.next(2);
    expect(recibidos).toEqual(['ok 1', 'ok 2']);
    expect(fallos.length).toBe(2);
    expect(terminado).toBeFalse();
  });

  it('switchMapSinCortar: descarta la respuesta de la consulta anterior', () => {
    const filtro = new Subject<number>();
    const lentas: { [k: number]: Subject<string> } = { 1: new Subject<string>(), 2: new Subject<string>() };
    const recibidos: string[] = [];
    filtro.pipe(switchMapSinCortar((v) => lentas[v])).subscribe((r) => recibidos.push(r));
    filtro.next(1);
    filtro.next(2);
    lentas[1].next('vieja');
    lentas[2].next('nueva');
    expect(recibidos).toEqual(['nueva']);
  });
});
