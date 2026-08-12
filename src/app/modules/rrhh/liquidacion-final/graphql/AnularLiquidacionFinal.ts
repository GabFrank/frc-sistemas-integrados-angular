import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { anularLiquidacionFinalMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class AnularLiquidacionFinalGQL extends Mutation<Response> { document = anularLiquidacionFinalMutation; }
