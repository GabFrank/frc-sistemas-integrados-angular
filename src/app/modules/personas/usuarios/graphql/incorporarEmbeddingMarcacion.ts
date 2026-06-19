import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import gql from 'graphql-tag';

export const incorporarEmbeddingMarcacionMutation = gql`
  mutation incorporarEmbeddingMarcacion($usuarioId: ID!, $embedding: [Float]!, $score: Float!) {
    data: incorporarEmbeddingMarcacion(usuarioId: $usuarioId, embedding: $embedding, score: $score) {
      resultado
      mensaje
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class IncorporarEmbeddingMarcacionGQL extends Mutation<{ data: { resultado: string; mensaje: string } }> {
  document = incorporarEmbeddingMarcacionMutation;
}
