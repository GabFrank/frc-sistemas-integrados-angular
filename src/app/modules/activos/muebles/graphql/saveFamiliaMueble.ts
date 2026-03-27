import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import gql from 'graphql-tag';
import { FamiliaMueble } from '../models/familia-mueble.model';

@Injectable({
  providedIn: 'root',
})
export class SaveFamiliaMuebleGQL extends Mutation<{data: FamiliaMueble}> {
  document = gql`
    mutation saveFamiliaMueble($entity: FamiliaMuebleInput!) {
      data: saveFamiliaMueble(familiaMueble: $entity) {
        id
        descripcion
      }
    }
  `;
}
