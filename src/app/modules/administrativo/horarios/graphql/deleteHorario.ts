
import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import gql from 'graphql-tag';

@Injectable({
    providedIn: 'root',
})
export class DeleteHorarioGQL extends Mutation<Response> {
    document = gql`
    mutation deleteHorario($id: ID!) {
      data: deleteHorario(id: $id)
    }
  `;
}
