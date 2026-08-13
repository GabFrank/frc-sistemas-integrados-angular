import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { pagarLiquidacionMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class PagarLiquidacionGQL extends Mutation<Response> { document = pagarLiquidacionMutation; }
