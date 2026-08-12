import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { aprobarLiquidacionMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class AprobarLiquidacionGQL extends Mutation<Response> { document = aprobarLiquidacionMutation; }
