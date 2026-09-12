import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { cerrarCapturaMuestraMutation } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class CerrarCapturaMuestraGQL extends Mutation {
  document = cerrarCapturaMuestraMutation;
}
