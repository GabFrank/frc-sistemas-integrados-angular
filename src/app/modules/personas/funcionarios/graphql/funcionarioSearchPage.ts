import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';
import { Funcionario } from '../funcionario.model';
import { PageInfo } from '../../../../app.component';

export interface Response {
  data: PageInfo<Funcionario>;
}

/** Buscador de funcionarios paginado: id, nombre o nickname. Existe en el central y en la filial. */
@Injectable({
  providedIn: 'root',
})
export class FuncionarioSearchPageGQL extends Query<Response> {
  document = gql`
    query ($texto: String, $page: Int, $size: Int, $soloActivos: Boolean) {
      data: funcionariosSearchPage(texto: $texto, page: $page, size: $size, soloActivos: $soloActivos) {
        getTotalPages
        getTotalElements
        getNumberOfElements
        isFirst
        isLast
        hasNext
        hasPrevious
        getContent {
          id
          activo
          nickname
          persona {
            id
            nombre
          }
          cargo {
            id
            nombre
          }
          sucursal {
            id
            nombre
          }
        }
      }
    }
  `;
}
