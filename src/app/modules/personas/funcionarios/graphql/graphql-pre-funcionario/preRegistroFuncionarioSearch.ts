import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PreRegistroFuncionario } from '../../pre-registro-funcionario.model';
import { preRegistroFuncionariosSearch } from './graphql-query';

export interface Response {
  data: PreRegistroFuncionario[];
}


@Injectable({
  providedIn: 'root',
})
export class PreRegistroFuncionarioesSearchGQL extends Query<Response> {
  document = preRegistroFuncionariosSearch;
}
