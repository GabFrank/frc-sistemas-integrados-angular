import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import gql from 'graphql-tag';

export interface Response {
  data: {
    id: number;
    activo: boolean;
    motivoDesvinculacion: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class DesvincularProductoProveedorGQL extends Mutation<Response> {
  document = gql`
    mutation desvincularProductoProveedor($id: ID!, $motivo: String!) {
      data: desvincularProductoProveedor(id: $id, motivo: $motivo) {
        id
        activo
        motivoDesvinculacion
      }
    }
  `;
}
