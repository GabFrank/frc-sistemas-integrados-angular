import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';
import { Persona } from '../persona.model';

class Response {
  data: Persona
}

/**
 * Solo el pais (#666). Documento propio y solo contra el central: el filial no tiene `pais` en Persona, y
 * agregarlo a las queries compartidas romperia las que van al filial.
 */
@Injectable({
  providedIn: 'root',
})
export class PersonaPaisGQL extends Query<Response> {
  document = gql`
    query ($id: ID!) {
      data: persona(id: $id) {
        id
        pais {
          id
          descripcion
          codigo
        }
      }
    }
  `;
}
