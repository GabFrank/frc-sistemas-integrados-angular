import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteLiquidacionConceptoQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class DeleteLiquidacionConceptoGQL extends Mutation<Response> { document = deleteLiquidacionConceptoQuery; }
