import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { agregarItemLiquidacionFinalMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class AgregarItemLiquidacionFinalGQL extends Mutation<Response> { document = agregarItemLiquidacionFinalMutation; }
