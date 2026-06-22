import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { EnteArchivo } from '../models/ente-archivo.model';
import { EnteArchivoInput } from '../models/ente-archivo-input.model';
import { saveEnteArchivoMutation } from './graphql-query';

export interface Response {
  data: EnteArchivo;
}

@Injectable({ providedIn: 'root' })
export class SaveEnteArchivoGQL extends Mutation<Response> {
  override document = saveEnteArchivoMutation;
}
