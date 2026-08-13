import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { aprobarLiquidacionFinalMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class AprobarLiquidacionFinalGQL extends Mutation<Response> { document = aprobarLiquidacionFinalMutation; }
