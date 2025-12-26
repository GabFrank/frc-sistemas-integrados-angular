import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';

export interface IsDistribucionConcluidaVariables {
  pedidoItemId: number;
}

export interface IsDistribucionConcluidaResponse {
  data: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class IsDistribucionConcluidaGQL extends Query<IsDistribucionConcluidaResponse, IsDistribucionConcluidaVariables> {
  document = gql`
    query isDistribucionConcluida($pedidoItemId: ID!) {
      data: isDistribucionConcluida(pedidoItemId: $pedidoItemId)
    }
  `;
} 