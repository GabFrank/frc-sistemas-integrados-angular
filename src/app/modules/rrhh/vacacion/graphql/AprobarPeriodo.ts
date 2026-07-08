import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { aprobarPeriodoMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class AprobarPeriodoGQL extends Mutation<Response> { document = aprobarPeriodoMutation; }
