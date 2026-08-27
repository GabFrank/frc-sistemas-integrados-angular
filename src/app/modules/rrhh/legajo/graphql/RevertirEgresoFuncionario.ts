import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { revertirEgresoFuncionarioMutation } from './graphql-query';

export interface Response { data: any; }

@Injectable({ providedIn: 'root' })
export class RevertirEgresoFuncionarioGQL extends Mutation<Response> { document = revertirEgresoFuncionarioMutation; }
