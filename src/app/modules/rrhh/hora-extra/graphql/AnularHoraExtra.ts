import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { HoraExtra } from '../hora-extra.model';
import { anularHoraExtraMutation } from './graphql-query';

export interface Response {
  data: HoraExtra;
}

@Injectable({ providedIn: 'root' })
export class AnularHoraExtraGQL extends Mutation<Response> {
  document = anularHoraExtraMutation;
}
