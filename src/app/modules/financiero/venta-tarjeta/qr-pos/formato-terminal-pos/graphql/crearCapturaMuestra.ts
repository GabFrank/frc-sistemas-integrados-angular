import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { crearCapturaMuestraMutation } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class CrearCapturaMuestraGQL extends Mutation {
  document = crearCapturaMuestraMutation;
}
