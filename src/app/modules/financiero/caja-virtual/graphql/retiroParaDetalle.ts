import { Injectable } from '@angular/core';
import { Query, gql } from 'apollo-angular';

/** El retiro de PDV que originó un ingreso de la caja mayor, con lo declarado por moneda (desk #721). */
export const retiroParaDetalleQuery = gql`
  query ($id: ID!, $sucId: ID) {
    data: retiro(id: $id, sucId: $sucId) {
      id
      estado
      observacion
      creadoEn
      sucursalId
      sucursal { id nombre }
      cajaSalida { id }
      responsable { id persona { nombre } }
      usuario { id persona { nombre } }
      retiroDetalleList {
        cantidad
        moneda { id denominacion simbolo decimales }
      }
    }
  }
`;

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class RetiroParaDetalleGQL extends Query<Response> {
  document = retiroParaDetalleQuery;
}
