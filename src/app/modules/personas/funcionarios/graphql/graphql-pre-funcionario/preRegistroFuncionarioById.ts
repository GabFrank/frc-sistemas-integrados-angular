import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PreRegistroFuncionario } from '../../pre-registro-funcionario.model';
import { preRegistroFuncionarioQuery } from './graphql-query';

export interface Response {
  data: PreRegistroFuncionario;
}

@Injectable({
  providedIn: 'root',
})
export class PreRegistroFuncionarioByIdGQL extends Query<Response> {
  document = preRegistroFuncionarioQuery;
}
