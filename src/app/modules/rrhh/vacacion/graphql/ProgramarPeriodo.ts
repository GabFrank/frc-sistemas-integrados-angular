import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { programarPeriodoMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class ProgramarPeriodoGQL extends Mutation<Response> { document = programarPeriodoMutation; }
