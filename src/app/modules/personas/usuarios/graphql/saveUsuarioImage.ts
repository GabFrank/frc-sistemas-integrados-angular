import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import gql from 'graphql-tag';

export const saveUsuarioImageMutation = gql`
  mutation saveUsuarioImage($id: ID!, $type: String!, $image: String!, $embedding: [Float]) {
    data: saveUsuarioImage(id: $id, type: $type, image: $image, embedding: $embedding)
  }
`;

@Injectable({ providedIn: 'root' })
export class SaveUsuarioImageGQL extends Mutation<boolean> {
  document = saveUsuarioImageMutation;
}
