import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';
import { Moneda } from '../../../financiero/moneda/moneda.model';

/**
 * Operaciones NUEVAS y separadas (Fase 3): leen la moneda de los precios. Ninguna consulta existente
 * pide `moneda`, porque contra un servidor viejo fallaría entera. Estas pueden fallar: quien las usa
 * se comporta como siempre (todo en la moneda de la empresa).
 */

/** CENTRAL: la moneda de cada precio de una presentación (null = la de la empresa). */
export const monedaDePreciosPorPresentacionQuery = gql`
  query ($id: Int) {
    data: precioPorSucursalPorPresentacionId(id: $id) {
      id
      moneda {
        id
        denominacion
        simbolo
        decimales
      }
    }
  }
`;

/** FILIAL: solo los precios que NO están en la moneda de la empresa. */
export const preciosEnOtraMonedaQuery = gql`
  query {
    data: preciosEnOtraMoneda {
      precioId
      moneda {
        id
        denominacion
        simbolo
        decimales
      }
    }
  }
`;

/** CENTRAL: las presentaciones de un producto con la moneda de cada precio (para saber en qué moneda está el precio principal). */
export const monedaDePreciosDeProductoQuery = gql`
  query ($id: ID!) {
    data: producto(id: $id) {
      id
      presentaciones {
        id
        principal
        precios {
          id
          principal
          activo
          moneda {
            id
            denominacion
            simbolo
            decimales
          }
        }
      }
    }
  }
`;

export interface MonedaDePrecioFila {
  id: number | string;
  moneda: Moneda | null;
}

export interface PrecioEnOtraMoneda {
  precioId: number | string;
  moneda: Moneda;
}

@Injectable({ providedIn: 'root' })
export class MonedaDePreciosPorPresentacionGQL extends Query<{ data: MonedaDePrecioFila[] }> {
  document = monedaDePreciosPorPresentacionQuery;
}

@Injectable({ providedIn: 'root' })
export class PreciosEnOtraMonedaGQL extends Query<{ data: PrecioEnOtraMoneda[] }> {
  document = preciosEnOtraMonedaQuery;
}

@Injectable({ providedIn: 'root' })
export class MonedaDePreciosDeProductoGQL extends Query<{ data: any }> {
  document = monedaDePreciosDeProductoQuery;
}
