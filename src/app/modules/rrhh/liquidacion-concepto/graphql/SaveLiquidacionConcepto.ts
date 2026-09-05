import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveLiquidacionConceptoQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class SaveLiquidacionConceptoGQL extends Mutation<Response> { document = saveLiquidacionConceptoQuery; }
