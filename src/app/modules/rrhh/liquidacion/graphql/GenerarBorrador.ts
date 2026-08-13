import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { generarBorradorMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class GenerarBorradorGQL extends Mutation<Response> { document = generarBorradorMutation; }
