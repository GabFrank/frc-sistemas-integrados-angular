import { Injectable } from '@angular/core';
import gql from 'graphql-tag';
import { Mutation } from 'apollo-angular';

export const actualizarCotizacionesMercadoQuery = gql`
  mutation actualizarCotizacionesMercado {
    data: actualizarCotizacionesMercado
  }
`;

@Injectable({ providedIn: 'root' })
export class ActualizarCotizacionesMercadoGQL extends Mutation {
  document = actualizarCotizacionesMercadoQuery;
}
