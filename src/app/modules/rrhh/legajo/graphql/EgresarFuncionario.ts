import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { egresarFuncionarioMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class EgresarFuncionarioGQL extends Mutation<Response> { document = egresarFuncionarioMutation; }
