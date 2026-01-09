import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';

@Injectable({
  providedIn: 'root',
})
export class VentasPorFuncionarioGQL extends Query<any> {
  override document = gql`
    query ventasPorFuncionario($inicio: String!, $fin: String!, $sucId: ID) {
      data: ventasPorFuncionario(inicio: $inicio, fin: $fin, sucId: $sucId) {

        id
        funcionario
        total
        cantidad
        productoMasVendido
        sucursales
      }
    }
  `;
}
