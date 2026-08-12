import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { anularLiquidacionMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class AnularLiquidacionGQL extends Mutation<Response> { document = anularLiquidacionMutation; }
