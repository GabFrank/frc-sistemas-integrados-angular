import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { CONTEXTO_SONDEO, LECTURA_ESTRICTA } from '../../../generics/generic-crud.constantes';
import { Moneda } from '../../financiero/moneda/moneda.model';
import {
  MonedaDePreciosDeProductoGQL,
  MonedaDePreciosPorPresentacionGQL,
  MonedaDePrecioFila,
  PrecioEnOtraMoneda,
  PreciosEnOtraMonedaGQL,
} from './graphql/preciosMoneda';

/**
 * Monedas de los precios de venta (Fase 3). Todo se lee con operaciones separadas que pueden fallar
 * (servidor viejo, sin red): en ese caso no hay mapa y quien llama sigue como siempre, con todo en la
 * moneda de la empresa.
 */
@Injectable({ providedIn: 'root' })
export class PrecioMonedaService {
  constructor(
    private genericService: GenericCrudService,
    private monedaDePreciosGQL: MonedaDePreciosPorPresentacionGQL,
    private preciosEnOtraMonedaGQL: PreciosEnOtraMonedaGQL,
    private monedaDePreciosDeProductoGQL: MonedaDePreciosDeProductoGQL,
  ) {}

  /**
   * CENTRAL. La moneda de cada precio de una presentación, por id del precio (como texto). El valor es
   * null cuando el precio está en la moneda de la empresa. Emite `null` (no el mapa) si no se pudo leer:
   * no se sabe en qué moneda están.
   */
  monedasDePreciosDePresentacion(presentacionId: number): Observable<Map<string, Moneda | null> | null> {
    return this.genericService
      .onCustomQuery(this.monedaDePreciosGQL, { id: presentacionId }, true, LECTURA_ESTRICTA, true, CONTEXTO_SONDEO)
      .pipe(
        map((filas: MonedaDePrecioFila[]) => (Array.isArray(filas) ? mapaDeMonedasPorPrecio(filas) : null)),
        catchError(() => of(null)),
      );
  }

  /**
   * CENTRAL. La moneda del precio principal de un producto (el de la presentación principal), para las
   * etiquetas. `null` = en la moneda de la empresa; `undefined` = no se pudo leer (se asume la de la empresa).
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
    return this.genericService
      .onCustomQuery(this.preciosEnOtraMonedaGQL, {}, false, LECTURA_ESTRICTA, true, CONTEXTO_SONDEO)
      .pipe(
        map((filas: PrecioEnOtraMoneda[]) => mapaDePreciosEnOtraMoneda(filas)),
        catchError(() => of(new Map<string, Moneda>())),
      );
  }
}

/** Función pura: filas `{id, moneda}` del central → mapa por id (texto). */
export function mapaDeMonedasPorPrecio(filas: MonedaDePrecioFila[]): Map<string, Moneda | null> {
  const mapa = new Map<string, Moneda | null>();
  (filas || []).forEach((f) => {
    if (f?.id != null) mapa.set(String(f.id), f.moneda ?? null);
  });
  return mapa;
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
