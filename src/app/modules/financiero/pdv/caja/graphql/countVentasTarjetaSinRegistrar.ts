import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';

const countVentasTarjetaSinRegistrarQuery = gql`
  query countVentasTarjetaSinRegistrar($cajaId: ID!, $sucId: ID!) {
    countVentasTarjetaSinRegistrar(cajaId: $cajaId, sucId: $sucId)
  }
`;

export interface Response {
  countVentasTarjetaSinRegistrar: number;
}

@Injectable({
  providedIn: 'root',
})
export class CountVentasTarjetaSinRegistrarGQL extends Query<Response> {
  document = countVentasTarjetaSinRegistrarQuery;
  client = 'servidor';
}
