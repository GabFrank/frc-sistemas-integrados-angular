import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { consultarLotesNowMutation } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class ConsultarLotesNowGQL extends Mutation<boolean> {
  document = consultarLotesNowMutation;
}


