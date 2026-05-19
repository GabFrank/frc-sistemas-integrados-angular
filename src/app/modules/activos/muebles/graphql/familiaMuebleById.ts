import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';
import { FamiliaMueble } from '../models/familia-mueble.model';

@Injectable({
  providedIn: 'root',
})
export class FamiliaMuebleByIdGQL extends Query<{ data: FamiliaMueble }> {
  override document = gql`
    query familiaMueble($id: ID!) {
      data: familiaMueble(id: $id) {
        id
        descripcion
      }
    }
  `;
}
