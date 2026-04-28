import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';

@Injectable({
    providedIn: 'root',
})
export class VentasPorSucursalGQL extends Query<any> {
    override document = gql`
    query ventasPorSucursal($inicio: String!, $fin: String!) {
      data: ventasPorSucursal(inicio: $inicio, fin: $fin) {
        sucId
        nombre
        total
      }
    }
  `;
}
