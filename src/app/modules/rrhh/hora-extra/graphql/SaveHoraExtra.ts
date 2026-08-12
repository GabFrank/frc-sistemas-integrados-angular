import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { HoraExtra } from '../hora-extra.model';
import { saveHoraExtraMutation } from './graphql-query';

export interface Response {
  data: HoraExtra;
}

@Injectable({ providedIn: 'root' })
export class SaveHoraExtraGQL extends Mutation<Response> {
  document = saveHoraExtraMutation;
}
