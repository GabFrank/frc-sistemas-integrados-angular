import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { marcarGozadaMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class MarcarGozadaGQL extends Mutation<Response> { document = marcarGozadaMutation; }
