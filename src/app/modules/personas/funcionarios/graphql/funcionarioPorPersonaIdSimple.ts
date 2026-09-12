import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Funcionario } from '../funcionario.model';
import { funcionarioPorPersonaSimpleQuery } from './graphql-query';

export interface Response {
  data: Funcionario;
}

@Injectable({
  providedIn: 'root',
})
export class FuncionarioPorPersonaIdSimpleGQL extends Query<Response> {
  document = funcionarioPorPersonaSimpleQuery;
}
