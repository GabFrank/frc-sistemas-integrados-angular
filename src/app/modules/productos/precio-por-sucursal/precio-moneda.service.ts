import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import { catchError, filter, map, take, tap } from 'rxjs/operators';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { CONTEXTO_SONDEO, LECTURA_ESTRICTA } from '../../../generics/generic-crud.constantes';
import { Moneda } from '../../financiero/moneda/moneda.model';
import {
  MonedaDePreciosDeProductoGQL,
  PrecioEnOtraMoneda,
  PreciosEnOtraMonedaGQL, MonedaPrecioPrincipalDeProductosGQL } from './graphql/preciosMoneda';

/** Estado del mapa de precios en otra moneda del central. */
export type EstadoMapaPrecios = 'sinCargar' | 'cargando' | 'ok' | 'error';

export interface MapaPreciosCentral {
  estado: EstadoMapaPrecios;
  /** precioId (texto) → moneda; solo precios que NO están en la moneda de la empresa. Vacío en bodega. */
  mapa: Map<string, Moneda>;
}

/**
 * Monedas de los precios de venta (Fase 3). Una sola lectura del central (`preciosEnOtraMoneda`) se guarda en
 * un mapa que se carga una vez tras el login, en silencio, y se refresca al guardar o borrar un precio. Si
 * falla, el mapa queda vacío en estado `error` y todo se comporta como siempre (moneda de la empresa).
 */
@Injectable({ providedIn: 'root' })
export class PrecioMonedaService {
  readonly mapaCentral$ = new BehaviorSubject<MapaPreciosCentral>({ estado: 'sinCargar', mapa: new Map() });
  private lectura = 0;

  constructor(
    private genericService: GenericCrudService,
    private preciosEnOtraMonedaGQL: PreciosEnOtraMonedaGQL,
    private monedaPrecioPrincipalDeProductosGQL: MonedaPrecioPrincipalDeProductosGQL,
    private monedaDePreciosDeProductoGQL: MonedaDePreciosDeProductoGQL,
  ) {}

  /** Carga el mapa si todavía no se cargó (idempotente). */
  asegurarMapaCentral(): void {
    if (this.mapaCentral$.value.estado === 'sinCargar') this.refrescarMapaCentral();
  }

  /** Vuelve a leer el mapa del central. Solo aplica la última lectura. */
  refrescarMapaCentral(): void {
    const n = ++this.lectura;
    const previo = this.mapaCentral$.value;
    // Mientras se relee se conserva lo que había (un guardado no hace parpadear los símbolos)
    this.mapaCentral$.next({ estado: 'cargando', mapa: previo.mapa });
    this.leerPreciosEnOtraMoneda(true).subscribe((mapa) => {
      if (n !== this.lectura) return;
      this.mapaCentral$.next(mapa == null ? { estado: 'error', mapa: new Map() } : { estado: 'ok', mapa });
    });
  }

  /** Al cerrar sesión. */
  limpiarMapaCentral(): void {
    this.lectura++;
    this.mapaCentral$.next({ estado: 'sinCargar', mapa: new Map() });
  }

  /** La moneda de un precio si NO es la de la empresa; null = la de la empresa (o no se sabe). Síncrono. */
  monedaDePrecio(precioId: number | string | null | undefined): Moneda | null {
    return precioId == null ? null : this.mapaCentral$.value.mapa.get(String(precioId)) ?? null;
  }

  /**
   * Emite el estado cuando el mapa terminó de cargar (ok o error) o, a lo sumo, a los `maxMs`: pasado ese
   * tiempo se sigue con lo que haya (estado `cargando`), nunca se espera más.
   */
  esperarMapaCentral(maxMs = 2000): Observable<MapaPreciosCentral> {
    this.asegurarMapaCentral();
    const listo$ = this.mapaCentral$.pipe(filter((m) => m.estado === 'ok' || m.estado === 'error'), take(1));
    return new Observable<MapaPreciosCentral>((obs) => {
      let hecho = false;
      const fin = (m: MapaPreciosCentral) => {
        if (hecho) return;
        hecho = true;
        obs.next(m);
        obs.complete();
      };
      const s1 = listo$.subscribe(fin);
      const s2 = timer(maxMs).subscribe(() => fin(this.mapaCentral$.value));
      return () => { s1.unsubscribe(); s2.unsubscribe(); };
    });
  }

  /**
   * CENTRAL. La moneda del precio principal de un producto (presentación principal → precio principal). Solo se usa
   * cuando el mapa tiene algún precio en otra moneda, para saber cuál es el precio principal. `null` = la de
   * la empresa; `undefined` = no se pudo leer.
   */
  monedaDelPrecioPrincipal(productoId: number): Observable<Moneda | null | undefined> {
    return this.genericService
      .onCustomQuery(this.monedaDePreciosDeProductoGQL, { id: productoId }, true, LECTURA_ESTRICTA, true, CONTEXTO_SONDEO)
      .pipe(
        map((producto: any) => (producto == null ? undefined : monedaDelPrecioPrincipalDe(producto))),
        catchError(() => of(undefined)),
      );
  }

  /**
   * FILIAL (PDV). Los precios que no están en la moneda de la empresa: precioId (texto) → moneda. Mapa
   * vacío si no hay ninguno o si la filial no conoce la operación (todo en la moneda de la empresa).
   */
  preciosEnOtraMoneda(): Observable<Map<string, Moneda>> {
    return this.leerPreciosEnOtraMoneda(false).pipe(
      map((m) => m ?? new Map<string, Moneda>()),
      tap((m) => (this.mapaPdv = m)),
    );
  }

  /**
   * CENTRAL: productoId → moneda del precio principal, para una página del listado. En silencio: si falla
   * (central viejo) emite un mapa vacío y la columna se muestra como siempre.
   */
  monedaPrecioPrincipalDeProductos(productoIds: (number | string)[]): Observable<Map<string, Moneda>> {
    if (!productoIds?.length || this.mapaCentral$.value.estado === 'error'
        || (this.mapaCentral$.value.estado === 'ok' && this.mapaCentral$.value.mapa.size === 0)) {
      // Sin precios en otra moneda (bodega) no hace falta preguntar.
      return of(new Map<string, Moneda>());
    }
    return this.genericService
      .onCustomQuery(this.monedaPrecioPrincipalDeProductosGQL, { productoIds }, true, LECTURA_ESTRICTA, true, CONTEXTO_SONDEO)
      .pipe(
        map((filas: { productoId: number | string; moneda: Moneda }[]) => {
          const m = new Map<string, Moneda>();
          (filas || []).forEach((f) => f?.productoId != null && f?.moneda && m.set(String(f.productoId), f.moneda));
          return m;
        }),
        catchError(() => of(new Map<string, Moneda>())),
      );
  }

  /** El último mapa leído de la filial para el PDV (vacío hasta abrirlo): lo usan los diálogos del PDV. */
  mapaPdv = new Map<string, Moneda>();

  /**
   * La moneda de la empresa mientras el PDV abierto opera en otra moneda (fase 4); null si el PDV usa la de la
   * empresa. La fija la pantalla de venta.
   */
  monedaEmpresaConPdvEnOtraMoneda: Moneda | null = null;

  /**
   * La moneda de un precio del PDV, o null si es de la moneda de la empresa. Con el PDV en otra moneda, un precio
   * de la empresa devuelve la moneda de la empresa: la tarjeta muestra «Gs. 7.000» y no un número sin moneda.
   */
  monedaPdvDe(precioId: number | string | null | undefined): Moneda | null {
    const propia = precioId == null ? null : this.mapaPdv.get(String(precioId)) ?? null;
    return propia ?? this.monedaEmpresaConPdvEnOtraMoneda;
  }

  /** Lee `preciosEnOtraMoneda` del central o de la filial; emite null si falla. */
  private leerPreciosEnOtraMoneda(central: boolean): Observable<Map<string, Moneda> | null> {
    return this.genericService
      .onCustomQuery(this.preciosEnOtraMonedaGQL, {}, central, LECTURA_ESTRICTA, true, CONTEXTO_SONDEO)
      .pipe(
        map((filas: PrecioEnOtraMoneda[]) => (Array.isArray(filas) ? mapaDePreciosEnOtraMoneda(filas) : null)),
        catchError(() => of(null)),
      );
  }
}

/** Función pura: filas de `preciosEnOtraMoneda` → mapa precioId (texto) → moneda. */
export function mapaDePreciosEnOtraMoneda(filas: PrecioEnOtraMoneda[]): Map<string, Moneda> {
  const mapa = new Map<string, Moneda>();
  (filas || []).forEach((f) => {
    if (f?.precioId != null && f?.moneda?.id != null) mapa.set(String(f.precioId), f.moneda);
  });
  return mapa;
}

/**
 * Función pura: de un producto con presentaciones y precios, la moneda del precio principal (presentación
 * principal → precio principal, activo si hay). null = sin moneda guardada (la de la empresa).
 */
export function monedaDelPrecioPrincipalDe(producto: any): Moneda | null {
  const presentaciones: any[] = producto?.presentaciones || [];
  const presentacion = presentaciones.find((p) => p?.principal === true) ?? presentaciones[0];
  const precios: any[] = presentacion?.precios || [];
  const precio = precios.find((p) => p?.principal === true && p?.activo !== false)
    ?? precios.find((p) => p?.principal === true);
  return precio?.moneda ?? null;
}
