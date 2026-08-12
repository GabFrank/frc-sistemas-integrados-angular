import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { anularEntradaVariaMutation } from './graphql-query';

export interface Response {
  data: any;
}

@Injectable({ providedIn: 'root' })
export class AnularEntradaVariaGQL extends Mutation<Response> {
  document = anularEntradaVariaMutation;
}
