import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Funcionario } from '../funcionario.model';
import { funcionarioQuery, funcionariosSearch } from './graphql-query';

export interface Response {
  data: Funcionario[];
}

@Injectable({
  providedIn: 'root',
})
export class FuncionarioSearchGQL extends Query<Response> {
  document = funcionariosSearch;
}
