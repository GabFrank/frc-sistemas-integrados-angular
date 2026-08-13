import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { generarLiquidacionFinalMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class GenerarLiquidacionFinalGQL extends Mutation<Response> { document = generarLiquidacionFinalMutation; }
