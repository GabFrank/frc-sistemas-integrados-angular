import { Observable, defer, from, of } from 'rxjs';
import { catchError, concatMap, defaultIfEmpty, map, take, takeWhile, toArray } from 'rxjs/operators';
import { erroresDeRechazo } from '../../../commons/core/utils/graphqlErrorUtils';

/**
 * `ok`: el servidor lo registró. `rechazo`: respondió que no (no registró nada). `sinRespuesta`: red, corte o
 * respuesta vacía: pudo haberse registrado. `noEnviado`: no se llegó a mandar porque uno anterior falló.
 */
export type EstadoDeEnvio = 'ok' | 'rechazo' | 'sinRespuesta' | 'noEnviado';

export interface ResultadoDeEnvio<T> {
  item: T;
  estado: EstadoDeEnvio;
  error?: any;
}

/**
 * Manda los pedidos de un lote **uno por uno** y corta en el primero que no sale bien; emite una vez, con el
 * resultado de cada ítem (los que no se mandaron quedan `noEnviado`).
 *
 * Antes iban en paralelo (`forkJoin`): si uno fallaba —aunque fuera un rechazo— los otros seguían en vuelo y se
 * aplicaban, y la pantalla quedaba con todos los montos como si no hubiera entrado ninguno: reintentar duplicaba
 * los que sí (#390). En serie siempre se sabe cuál entró.
 *
 * `enviar` se llama recién cuando le toca a cada ítem: `GenericCrudService.onSaveCustom` abre su modal
 * «Guardando…» al llamarlo, no al suscribirse.
 */
export function enviarEnSerie<T>(items: T[], enviar: (item: T) => Observable<any>): Observable<ResultadoDeEnvio<T>[]> {
  return from(items).pipe(
    concatMap(item => defer(() => enviar(item)).pipe(
      take(1),
      map((): ResultadoDeEnvio<T> => ({ item, estado: 'ok' })),
      // Terminó sin emitir nada: no se sabe si se registró, y no se sigue con los demás.
      defaultIfEmpty<ResultadoDeEnvio<T>, ResultadoDeEnvio<T>>({ item, estado: 'sinRespuesta' }),
      catchError((error): Observable<ResultadoDeEnvio<T>> =>
        of({ item, estado: erroresDeRechazo(error) ? 'rechazo' : 'sinRespuesta', error })),
    )),
    takeWhile(r => r.estado === 'ok', true),
    toArray(),
    map(hechos => [
      ...hechos,
      ...items.slice(hechos.length).map((item): ResultadoDeEnvio<T> => ({ item, estado: 'noEnviado' })),
    ]),
  );
}

export interface ResumenDeLote {
  /** Todos registrados. */
  todoOk: boolean;
  /** Ninguno registrado y el primero fue un rechazo claro: no cambió nada y se puede corregir y reintentar. */
  nadaCambio: boolean;
  /** Qué pasó con cada uno, para avisar cuando el lote quedó a medias o en duda. */
  texto: string;
}

/** Resume el resultado de un lote. `nombre` identifica cada ítem en el aviso (p. ej. la moneda). */
export function resumirLote<T>(resultados: ResultadoDeEnvio<T>[], nombre: (item: T) => string): ResumenDeLote {
  const de = (estado: EstadoDeEnvio) => resultados.filter(r => r.estado === estado);
  const nombres = (rs: ResultadoDeEnvio<T>[]) => rs.map(r => nombre(r.item)).join(', ');
  const ok = de('ok'), rechazo = de('rechazo'), sinRespuesta = de('sinRespuesta'), noEnviado = de('noEnviado');
  const partes: string[] = [];
  if (ok.length) partes.push(`Se registró: ${nombres(ok)}.`);
  if (rechazo.length) {
    const motivo = erroresDeRechazo(rechazo[0].error)?.[0]?.message;
    partes.push(`Rechazado: ${nombres(rechazo)}${motivo ? ` (${motivo})` : ''}.`);
  }
  if (sinRespuesta.length) partes.push(`Sin confirmar (pudo haberse registrado): ${nombres(sinRespuesta)}.`);
  if (noEnviado.length) partes.push(`No se envió: ${nombres(noEnviado)}.`);
  return {
    todoOk: ok.length === resultados.length,
    nadaCambio: ok.length === 0 && sinRespuesta.length === 0,
    texto: partes.join(' ') + ' Revisá los movimientos de la caja antes de cargar lo que falta.',
  };
}
