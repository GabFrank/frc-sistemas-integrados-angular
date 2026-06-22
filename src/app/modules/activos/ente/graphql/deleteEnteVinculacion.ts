import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteEnteVinculacionMutation } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteEnteVinculacionGQL extends Mutation<{ data: boolean }> {
  override document = deleteEnteVinculacionMutation;
}
