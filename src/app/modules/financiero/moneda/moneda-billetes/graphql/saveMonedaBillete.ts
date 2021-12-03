import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { MonedaBillete } from '../moneda-billetes.model';
import { saveMonedaBilletes } from './graphql-query';

export interface Response {
  data: MonedaBillete;
}

@Injectable({
  providedIn: 'root',
})
export class SaveMonedaBilleteGQL extends Mutation<Response> {
  document = saveMonedaBilletes;
}
