import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';

@Injectable({
    providedIn: 'root',
})
export class VentasPorHoraGQL extends Query<any> {
    override document = gql`
    query ventasPorHora($fecha: String!, $sucId: ID) {
      data: ventasPorHora(fecha: $fecha, sucId: $sucId) {
        hora
        total
        cantidad
      }
    }
  `;
}
