import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Funcionario } from '../funcionario.model';
import { funcionarioQuery, saveFuncionario } from './graphql-query';

export interface Response {
  data: Funcionario;
}

@Injectable({
  providedIn: 'root',
})
export class SaveFuncionarioGQL extends Mutation<Response> {
  document = saveFuncionario;
}
