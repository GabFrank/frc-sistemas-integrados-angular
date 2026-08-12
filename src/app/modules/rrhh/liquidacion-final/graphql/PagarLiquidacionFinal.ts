import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { pagarLiquidacionFinalMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class PagarLiquidacionFinalGQL extends Mutation<Response> { document = pagarLiquidacionFinalMutation; }
