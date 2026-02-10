import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import gql from 'graphql-tag';

export const saveUserImageMutation = gql`
  mutation saveUserImage($id: ID!, $type: String!, $image: String!) {
    data: saveUserImage(id: $id, type: $type, image: $image)
  }
`;

@Injectable({ providedIn: 'root' })
export class SaveUserImageGQL extends Mutation<boolean> {
    document = saveUserImageMutation;
}
