import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Actualizacion } from '../actualizacion.model';
import { saveActualizacionForSucursales } from './graphql-query';

export interface Response {
  data: Actualizacion;
}

@Injectable({
  providedIn: 'root',
})
export class SaveActualizacionForSucursalesGQL extends Mutation<Response> {
  document = saveActualizacionForSucursales;
}
