import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveCajaVirtualConfiguracionMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class SaveCajaVirtualConfiguracionGQL extends Mutation<Response> {
  document = saveCajaVirtualConfiguracionMutation;
}
