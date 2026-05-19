import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import gql from 'graphql-tag';
import { TipoMueble } from '../models/tipo-mueble.model';

@Injectable({
  providedIn: 'root',
})
export class SaveTipoMuebleGQL extends Mutation<{data: TipoMueble}> {
  document = gql`
    mutation saveTipoMueble($entity: TipoMuebleInput!) {
      data: saveTipoMueble(tipoMueble: $entity) {
        id
        descripcion
      }
    }
  `;
}
