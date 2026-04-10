import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';

@Injectable({
  providedIn: 'root',
})
export class PreGastoStatusMetadataListGQL extends Query<any> {
  document = gql`
    query getPreGastoStatusMetadataList {
      data: getPreGastoStatusMetadataList {
        estado
        etiqueta
        icono
        color
      }
    }
  `;
}
