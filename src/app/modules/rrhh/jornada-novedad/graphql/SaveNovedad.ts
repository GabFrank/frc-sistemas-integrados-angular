import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { JornadaNovedad } from '../jornada-novedad.model';
import { saveNovedadMutation } from './graphql-query';

export interface Response {
  data: JornadaNovedad;
}

@Injectable({ providedIn: 'root' })
export class SaveNovedadGQL extends Mutation<Response> {
  document = saveNovedadMutation;
}
