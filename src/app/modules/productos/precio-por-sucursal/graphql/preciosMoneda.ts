import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';
import { Moneda } from '../../../financiero/moneda/moneda.model';

/**
 * Operaciones NUEVAS y separadas (Fase 3): leen la moneda de los precios. Ninguna consulta existente
 * pide `moneda`, porque contra un servidor viejo fallaría entera. Estas pueden fallar: quien las usa
 * se comporta como siempre (todo en la moneda de la empresa).
 */

/** FILIAL y CENTRAL (misma forma): solo los precios que NO están en la moneda de la empresa. */
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

/** CENTRAL: para una página de productos, la moneda del precio principal (solo los que no están en la de la empresa). */
export const monedaPrecioPrincipalDeProductosQuery = gql`
  query ($productoIds: [ID]!) {
    data: monedaPrecioPrincipalDeProductos(productoIds: $productoIds) {
      productoId
      moneda {
        id
        denominacion
        simbolo
        decimales
      }
    }
  }
`;

export interface PrecioEnOtraMoneda {
  precioId: number | string;
  moneda: Moneda;
}

@Injectable({ providedIn: 'root' })
export class PreciosEnOtraMonedaGQL extends Query<{ data: PrecioEnOtraMoneda[] }> {
  document = preciosEnOtraMonedaQuery;
}

@Injectable({ providedIn: 'root' })
export class MonedaDePreciosDeProductoGQL extends Query<{ data: any }> {
  document = monedaDePreciosDeProductoQuery;
}

@Injectable({ providedIn: 'root' })
export class MonedaPrecioPrincipalDeProductosGQL extends Query<{ data: { productoId: number | string; moneda: Moneda }[] }> {
  document = monedaPrecioPrincipalDeProductosQuery;
}
