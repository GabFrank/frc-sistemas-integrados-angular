import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { conceptosParaItemManualQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class ConceptosParaItemManualGQL extends Query<Response> { document = conceptosParaItemManualQuery; }
