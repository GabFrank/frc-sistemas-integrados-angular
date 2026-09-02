import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { anularVerificacionRetiroMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class AnularVerificacionRetiroGQL extends Mutation<Response> {
  document = anularVerificacionRetiroMutation;
}
