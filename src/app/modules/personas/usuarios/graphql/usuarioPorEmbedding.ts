import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Usuario } from '../usuario.model';
import gql from 'graphql-tag';

export interface UsuarioSimilitud {
  usuario: Usuario;
  similitud: number;
}

@Injectable({
  providedIn: 'root',
})
export class UsuarioPorEmbeddingGQL extends Query<{ data: UsuarioSimilitud }> {
  document = gql`
    query usuarioPorEmbedding($embedding: [Float]) {
      data: usuarioPorEmbedding(embedding: $embedding) {
        usuario {
          id
          nickname
          activo
          persona {
            id
            nombre
            imagenes
          }
        }
        similitud
      }
    }
  `;
}
