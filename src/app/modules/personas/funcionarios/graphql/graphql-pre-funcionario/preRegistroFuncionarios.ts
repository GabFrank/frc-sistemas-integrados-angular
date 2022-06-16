import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PreRegistroFuncionario } from '../../pre-registro-funcionario.model';
import { preRegistroFuncionariosQuery } from './graphql-query';

export interface Response {
  data: PreRegistroFuncionario;
}

@Injectable({
  providedIn: 'root',
})
export class PreRegistroFuncionariosGQL extends Query<Response> {
  document = preRegistroFuncionariosQuery;
}
