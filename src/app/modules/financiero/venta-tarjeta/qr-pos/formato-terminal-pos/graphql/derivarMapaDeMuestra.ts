import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { derivarMapaDeMuestraMutation } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DerivarMapaDeMuestraGQL extends Mutation {
  document = derivarMapaDeMuestraMutation;
}
