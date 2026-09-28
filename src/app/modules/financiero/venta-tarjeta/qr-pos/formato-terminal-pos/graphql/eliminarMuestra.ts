import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { eliminarMuestraMutation } from './graphql-query';

@Injectable({ providedIn: 'root' })
export class EliminarMuestraGQL extends Mutation<any> {
  document = eliminarMuestraMutation;
}
