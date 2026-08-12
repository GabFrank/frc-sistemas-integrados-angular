import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { volverBorradorLiquidacionFinalMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class VolverBorradorLiquidacionFinalGQL extends Mutation<Response> { document = volverBorradorLiquidacionFinalMutation; }
