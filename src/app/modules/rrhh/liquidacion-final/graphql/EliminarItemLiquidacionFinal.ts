import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { eliminarItemLiquidacionFinalMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class EliminarItemLiquidacionFinalGQL extends Mutation<Response> { document = eliminarItemLiquidacionFinalMutation; }
