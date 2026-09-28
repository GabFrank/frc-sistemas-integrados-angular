import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { guardarRegionesDerivadasMutation } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class GuardarRegionesDerivadasGQL extends Mutation {
  document = guardarRegionesDerivadasMutation;
}
