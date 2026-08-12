import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { imprimirReciboFinalQuery } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class ImprimirReciboFinalGQL extends Query<Response> { document = imprimirReciboFinalQuery; }
