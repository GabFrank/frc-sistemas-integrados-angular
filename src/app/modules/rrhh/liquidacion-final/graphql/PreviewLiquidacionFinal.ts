import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { previewLiquidacionFinalQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class PreviewLiquidacionFinalGQL extends Query<Response> { document = previewLiquidacionFinalQuery; }
